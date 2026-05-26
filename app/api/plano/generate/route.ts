import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { cefisFetch } from "@/lib/cefis-client";
import {
  planoPrompt,
  type OnboardingInput,
  type DiagnosticoAnswer,
  type CatalogItem,
} from "@/lib/prompts";
import type {
  CefisCoursesListResponse,
  CefisTracksListResponse,
} from "@/lib/types";

type PlanoRequest = {
  onboarding: OnboardingInput;
  answers: DiagnosticoAnswer[];
};

type PlanoResponse = {
  summary: string;
  estimatedTotalMinutes: number;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    type: "course" | "track" | "concept";
    courseId: number | null;
    trackId: number | null;
    estimatedMinutes: number;
  }>;
};

function isPlanoRequest(x: unknown): x is PlanoRequest {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    !!o.onboarding &&
    typeof o.onboarding === "object" &&
    Array.isArray(o.answers)
  );
}

/**
 * POST /api/plano/generate
 *
 * Body: { onboarding: OnboardingInput, answers: DiagnosticoAnswer[] }
 *
 * Fluxo:
 *  1. Busca cursos relevantes (search pelo objetivo declarado) — top 20
 *  2. Busca trilhas — top 10
 *  3. Passa catálogo real + respostas pro LLM
 *  4. LLM monta plano referenciando IDs reais
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

  if (!isPlanoRequest(body)) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        message: "Payload deve conter onboarding (objeto) e answers (array).",
      },
      { status: 422 }
    );
  }

  try {
    // 1. Buscar catálogo relevante via search com o objetivo declarado
    //    Limita a 20 cursos + 10 trilhas pra não estourar context do LLM.
    const searchTerm = body.onboarding.objective.split(/\s+/).slice(0, 5).join(" ");

    const [coursesRes, tracksRes] = await Promise.all([
      cefisFetch<CefisCoursesListResponse>({
        version: "v3",
        path: "/courses",
        query: { search: searchTerm, count: 20 },
        revalidate: 300,
      }).catch(() => null),
      cefisFetch<CefisTracksListResponse>({
        version: "v3",
        path: "/tracks",
        query: { count: 10 },
        revalidate: 300,
      }).catch(() => null),
    ]);

    const catalog: CatalogItem[] = [];

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

    // 2. Gerar plano via LLM
    const messages = planoPrompt(body.onboarding, body.answers, catalog);
    const plan = await chatJson<PlanoResponse>(messages, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    if (!plan?.steps || !Array.isArray(plan.steps)) {
      throw new Error("LLM retornou estrutura sem 'steps[]'");
    }

    return NextResponse.json({
      ...plan,
      catalogSize: catalog.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "plano_failed", message },
      { status: 502 }
    );
  }
}
