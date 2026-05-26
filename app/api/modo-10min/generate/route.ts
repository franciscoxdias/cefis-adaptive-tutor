import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { cefisFetch } from "@/lib/cefis-client";
import { modoDezPrompt, type TutorExcerpt } from "@/lib/prompts";
import { stubModoDez } from "@/lib/stub-responses";
import { fetchAndParseSubtitle } from "@/lib/subtitles-fetcher";
import { searchSegments } from "@/lib/vtt-parser";
import type {
  CefisCoursesListResponse,
  CefisLessonsListResponse,
} from "@/lib/types";

// Mais agressivo que o /tutor — modo 10min explora mais aulas pra cobrir o tópico
const TOP_COURSES_TO_EXPLORE = 3;
const TOP_LESSONS_PER_COURSE = 2;
const MAX_EXCERPTS = 8;

type ModoDezRequest = { topic: string };

type ModoDezLLMResponse = {
  title: string;
  summary: string;
  keyPoints: string[];
  closing: string;
  estimatedReadingMinutes: number;
};

function isModoDezRequest(x: unknown): x is ModoDezRequest {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.topic === "string" && o.topic.trim().length >= 3;
}

/**
 * POST /api/modo-10min/generate
 *
 * Body: { topic: string }
 *
 * Pipeline:
 *  1. Busca cursos via search (fallback progressivo)
 *  2. Top 3 cursos × top 2 aulas = até 6 aulas
 *  3. fetchAndParseSubtitle paralelo (catch ignora aulas sem VTT)
 *  4. searchSegments em cada VTT pelo topic → round-robin top 8
 *  5. LLM gera síntese 10min usando excerpts como evidência
 *  6. Fallback: stub que devolve trechos reais como pontos-chave
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

  if (!isModoDezRequest(body)) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        message: "Payload deve conter topic (string com pelo menos 3 chars).",
      },
      { status: 422 }
    );
  }

  const topic = body.topic.trim();

  // ──── 1. Search progressivo nos cursos ────
  const keywords = topic
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter(
      (w) =>
        ![
          "como","quando","onde","qual","quais","quem","sobre","entre","mais",
          "muito","pode","esse","essa","isso","este","esta","aquele","aquela",
        ].includes(w)
    );

  const attempts: string[] = [];
  if (keywords.length >= 2) attempts.push(keywords.slice(0, 2).join(" "));
  if (keywords.length >= 1) attempts.push(keywords[0]);
  attempts.push(topic);
  const uniqueAttempts = Array.from(new Set(attempts));

  let coursesData: CefisCoursesListResponse["data"] = [];
  let usedSearchTerm: string | null = null;
  let cefisError: string | null = null;

  try {
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
  } catch (err) {
    cefisError = err instanceof Error ? err.message : "unknown CEFIS error";
  }

  // ──── 2. Buscar aulas e VTTs ────
  const excerpts: TutorExcerpt[] = [];
  let vttFetches = 0;
  let vttErrors = 0;

  const topCourses = coursesData.slice(0, TOP_COURSES_TO_EXPLORE);

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
              const matches = searchSegments(parsed.segments, topic, 4);
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

    const collected = (await Promise.all(vttPromises)).flat();

    // Round-robin entre aulas pra ter variedade
    const byLesson = new Map<number, TutorExcerpt[]>();
    for (const ex of collected) {
      const arr = byLesson.get(ex.lessonId) ?? [];
      arr.push(ex);
      byLesson.set(ex.lessonId, arr);
    }

    let round = 0;
    while (excerpts.length < MAX_EXCERPTS) {
      let added = false;
      for (const arr of byLesson.values()) {
        if (round < arr.length) {
          excerpts.push(arr[round]);
          added = true;
          if (excerpts.length >= MAX_EXCERPTS) break;
        }
      }
      if (!added) break;
      round++;
    }
  }

  // Coverage classification:
  const coverage: "cefis" | "cefis-related" | "ai-complementary" =
    excerpts.length > 0
      ? "cefis"
      : coursesData.length > 0
        ? "cefis-related"
        : "ai-complementary";

  // ──── 3. LLM ou stub ────
  try {
    const messages = modoDezPrompt(topic, excerpts);
    const result = await chatJson<ModoDezLLMResponse>(messages, {
      temperature: 0.4,
      maxTokens: 1500,
    });

    if (
      typeof result?.title !== "string" ||
      typeof result?.summary !== "string"
    ) {
      throw new Error("LLM retornou estrutura sem campos obrigatórios");
    }

    return NextResponse.json({
      ...result,
      topic,
      excerpts,
      coverage,
      source: "llm",
      cefisError,
      usedSearchTerm,
      vttFetches,
      vttErrors,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const llmError = err instanceof Error ? err.message : "unknown error";
    const stub = stubModoDez(topic, excerpts);

    return NextResponse.json({
      ...stub,
      topic,
      excerpts,
      coverage,
      source: "stub",
      llmError,
      cefisError,
      usedSearchTerm,
      vttFetches,
      vttErrors,
      generatedAt: new Date().toISOString(),
    });
  }
}
