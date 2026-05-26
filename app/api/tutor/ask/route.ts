import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { cefisFetch } from "@/lib/cefis-client";
import {
  tutorPrompt,
  type CatalogItem,
  type TutorMessage,
  type TutorExcerpt,
} from "@/lib/prompts";
import { stubTutor } from "@/lib/stub-responses";
import { fetchAndParseSubtitle } from "@/lib/subtitles-fetcher";
import { searchSegments } from "@/lib/vtt-parser";
import type {
  CefisCoursesListResponse,
  CefisLessonsListResponse,
  CefisTracksListResponse,
} from "@/lib/types";

// Parâmetros de profundidade do grounding (ajustáveis se custo/latência apertar)
const TOP_COURSES_TO_DEEP_DIVE = 2;
const TOP_LESSONS_PER_COURSE = 2;
const TOP_EXCERPTS_TO_LLM = 5;

type TutorRequest = {
  question: string;
  history?: TutorMessage[];
};

type TutorReference = {
  type: "course" | "track" | "lesson";
  id: number;
  title: string;
  courseId?: number;
  timestamp?: string;
};

type TutorLLMResponse = {
  answer: string;
  references: TutorReference[];
};

function isTutorRequest(x: unknown): x is TutorRequest {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.question !== "string" || o.question.trim().length === 0) {
    return false;
  }
  if (o.history !== undefined && !Array.isArray(o.history)) return false;
  return true;
}

/**
 * POST /api/tutor/ask
 *
 * Pipeline grounded:
 *  1. Busca cursos via /courses?search
 *  2. Busca trilhas (contexto adicional)
 *  3. Pra top 2 cursos: busca aulas → pega top 2 aulas → fetch+parse VTT
 *  4. searchSegments (busca textual nos VTTs agregados)
 *  5. Top 5 excerpts → contexto pro LLM
 *  6. Tenta LLM real → cai pra stub se falhar
 *  7. Stub também usa excerpts pra retornar resposta plausível com timestamps
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body deve ser JSON válido." },
      { status: 400 }
    );
  }

  if (!isTutorRequest(body)) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        message: "Payload deve conter question (string não vazia).",
      },
      { status: 422 }
    );
  }

  const question = body.question.trim();
  const history = body.history ?? [];

  // Search strategy: tenta combos de keywords do mais específico ao mais simples
  // até obter pelo menos 1 curso. CEFIS faz match literal em title/subtitle/keywords.
  const keywords = question
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !["como","quando","onde","qual","quais","quem","sobre","entre","mais","muito","pode","esse","essa","isso","este","esta","aquele","aquela"].includes(w));

  const searchAttempts: string[] = [];
  if (keywords.length >= 2) searchAttempts.push(keywords.slice(0, 2).join(" "));
  if (keywords.length >= 1) searchAttempts.push(keywords[0]);
  searchAttempts.push(question);
  // dedupe
  const uniqueAttempts = Array.from(new Set(searchAttempts));

  const catalog: CatalogItem[] = [];
  const excerpts: TutorExcerpt[] = [];
  let cefisError: string | null = null;
  let vttFetches = 0;
  let vttErrors = 0;
  let usedSearchTerm: string | null = null;

  // ──── 1. Buscar catálogo (cursos com fallback progressivo + trilhas) ────
  let topCourses: Array<{ id: number; title: string }> = [];
  let coursesData: CefisCoursesListResponse["data"] = [];

  try {
    // Trilhas em paralelo (sempre busca igual)
    const tracksPromise = cefisFetch<CefisTracksListResponse>({
      version: "v3",
      path: "/tracks",
      query: { count: 5 },
      revalidate: 300,
    }).catch(() => null);

    // Cursos com fallback: tenta cada attempt até achar resultado
    for (const term of uniqueAttempts) {
      const res = await cefisFetch<CefisCoursesListResponse>({
        version: "v3",
        path: "/courses",
        query: { search: term, count: 8 },
        revalidate: 300,
      }).catch(() => null);

      if (res?.data && res.data.length > 0) {
        coursesData = res.data;
        usedSearchTerm = term;
        break;
      }
    }

    const tracksRes = await tracksPromise;

    for (const c of coursesData) {
      catalog.push({
        type: "course",
        id: c.id,
        title: c.title,
        description: c.subtitle ?? c.summary ?? null,
        duration: c.duration,
        categories: c.categories,
      });
    }
    topCourses = coursesData
      .slice(0, TOP_COURSES_TO_DEEP_DIVE)
      .map((c) => ({ id: c.id, title: c.title }));

    if (tracksRes?.data) {
      for (const t of tracksRes.data) {
        catalog.push({
          type: "track",
          id: t.id,
          title: t.name,
          description: t.description ?? null,
          duration: t.duration,
          categories: t.categories,
        });
      }
    }
  } catch (err) {
    cefisError = err instanceof Error ? err.message : "unknown CEFIS error";
  }

  // ──── 2. Pra top cursos: buscar aulas + parse VTT ────
  if (topCourses.length > 0) {
    const lessonsPerCourse = await Promise.all(
      topCourses.map((c) =>
        cefisFetch<CefisLessonsListResponse>({
          version: "v3",
          path: `/courses/${c.id}/lessons`,
          revalidate: 600,
        })
          .then((res) => ({
            course: c,
            lessons: (res.data ?? []).slice(0, TOP_LESSONS_PER_COURSE),
          }))
          .catch(() => ({ course: c, lessons: [] }))
      )
    );

    const vttPromises: Array<Promise<TutorExcerpt[]>> = [];

    for (const { course, lessons } of lessonsPerCourse) {
      for (const lesson of lessons) {
        vttFetches++;
        vttPromises.push(
          fetchAndParseSubtitle(lesson.id)
            .then((parsed) => {
              const matches = searchSegments(parsed.segments, question, 3);
              return matches.map((m) => ({
                courseId: course.id,
                courseTitle: course.title,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                timestamp: m.timestamp,
                text: m.text,
              }));
            })
            .catch(() => {
              vttErrors++;
              return [] as TutorExcerpt[];
            })
        );
      }
    }

    const collectedExcerpts = (await Promise.all(vttPromises)).flat();

    // Ordena por relevância: agrupa por lesson e pega um por aula (variedade)
    // depois trunca em TOP_EXCERPTS_TO_LLM
    const byLesson = new Map<number, TutorExcerpt[]>();
    for (const ex of collectedExcerpts) {
      const arr = byLesson.get(ex.lessonId) ?? [];
      arr.push(ex);
      byLesson.set(ex.lessonId, arr);
    }

    // Round-robin: pega o melhor de cada aula, depois o segundo, etc
    let round = 0;
    while (excerpts.length < TOP_EXCERPTS_TO_LLM) {
      let added = false;
      for (const arr of byLesson.values()) {
        if (round < arr.length) {
          excerpts.push(arr[round]);
          added = true;
          if (excerpts.length >= TOP_EXCERPTS_TO_LLM) break;
        }
      }
      if (!added) break;
      round++;
    }
  }

  // ──── 3. Tentar LLM, cair pra stub ────
  try {
    const messages = tutorPrompt(question, catalog, history, excerpts);
    const result = await chatJson<TutorLLMResponse>(messages, {
      temperature: 0.4,
      maxTokens: 800,
    });

    if (typeof result?.answer !== "string") {
      throw new Error("LLM retornou estrutura sem 'answer'");
    }

    return NextResponse.json({
      answer: result.answer,
      references: Array.isArray(result.references) ? result.references : [],
      source: "llm",
      cefisError,
      catalogSize: catalog.length,
      excerptsCount: excerpts.length,
      vttFetches,
      vttErrors,
      usedSearchTerm,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const llmError = err instanceof Error ? err.message : "unknown error";
    const stub = stubTutor(question, catalog, excerpts);

    return NextResponse.json({
      answer: stub.answer,
      references: stub.references,
      source: "stub",
      llmError,
      cefisError,
      catalogSize: catalog.length,
      excerptsCount: excerpts.length,
      vttFetches,
      vttErrors,
      usedSearchTerm,
      generatedAt: new Date().toISOString(),
    });
  }
}
