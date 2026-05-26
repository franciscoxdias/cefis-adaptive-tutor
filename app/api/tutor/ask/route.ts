import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { cefisFetch } from "@/lib/cefis-client";
import {
  tutorPrompt,
  type CatalogItem,
  type TutorMessage,
} from "@/lib/prompts";
import { stubTutor } from "@/lib/stub-responses";
import type {
  CefisCoursesListResponse,
  CefisTracksListResponse,
} from "@/lib/types";

type TutorRequest = {
  question: string;
  history?: TutorMessage[];
};

type TutorLLMResponse = {
  answer: string;
  references: Array<{ type: "course" | "track"; id: number; title: string }>;
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
 * Body: { question: string, history?: TutorMessage[] }
 *
 * Fluxo:
 *  1. Busca catálogo relacionado à pergunta (search nos cursos + lista trilhas)
 *  2. Tenta LLM com prompt grounded no catálogo
 *  3. Se LLM falhar, retorna stub determinístico listando itens reais
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

  // 1. Buscar catálogo relevante via search da pergunta
  const searchTerm = question
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .join(" ");

  const catalog: CatalogItem[] = [];
  let cefisError: string | null = null;

  try {
    const [coursesRes, tracksRes] = await Promise.all([
      cefisFetch<CefisCoursesListResponse>({
        version: "v3",
        path: "/courses",
        query: { search: searchTerm || question, count: 8 },
        revalidate: 300,
      }).catch(() => null),
      cefisFetch<CefisTracksListResponse>({
        version: "v3",
        path: "/tracks",
        query: { count: 5 },
        revalidate: 300,
      }).catch(() => null),
    ]);

    if (coursesRes?.data) {
      for (const c of coursesRes.data) {
        catalog.push({
          type: "course",
          id: c.id,
          title: c.title,
          description: c.subtitle ?? c.summary ?? null,
          duration: c.duration,
          categories: c.categories,
        });
      }
    }

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

  // 2. Tentar LLM, cair pra stub se falhar
  try {
    const messages = tutorPrompt(question, catalog, history);
    const result = await chatJson<TutorLLMResponse>(messages, {
      temperature: 0.4,
      maxTokens: 700,
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
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const llmError = err instanceof Error ? err.message : "unknown error";
    const stub = stubTutor(question, catalog);

    return NextResponse.json({
      answer: stub.answer,
      references: stub.references,
      source: "stub",
      llmError,
      cefisError,
      catalogSize: catalog.length,
      generatedAt: new Date().toISOString(),
    });
  }
}
