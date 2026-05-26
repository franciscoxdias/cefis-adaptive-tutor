import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { diagnosticoPrompt, type OnboardingInput } from "@/lib/prompts";
import { stubDiagnostico } from "@/lib/stub-responses";

type DiagnosticoResponse = {
  questions: Array<{ id: string; question: string; why: string }>;
};

function isOnboardingInput(x: unknown): x is OnboardingInput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.objective === "string" &&
    ["iniciante", "intermediario", "avancado"].includes(o.level as string) &&
    ["10min", "30min", "60min", "120min"].includes(o.timePerDay as string)
  );
}

/**
 * POST /api/diagnostico/generate
 *
 * Body: OnboardingInput
 * Returns: { questions: [{id, question, why}] }
 *
 * Pede ao LLM ativo (OpenAI ou Anthropic) pra gerar 3-5 perguntas de
 * diagnóstico personalizadas ao objetivo e nível do aluno.
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

  if (!isOnboardingInput(body)) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        message:
          "Payload deve conter: name, objective, level (iniciante|intermediario|avancado), timePerDay (10min|30min|60min|120min).",
      },
      { status: 422 }
    );
  }

  // Tenta LLM real. Se falhar (key ausente, billing, rate limit),
  // cai para stub determinístico baseado em template.
  try {
    const messages = diagnosticoPrompt(body);
    const result = await chatJson<DiagnosticoResponse>(messages, {
      temperature: 0.5,
      maxTokens: 1000,
    });

    if (!result?.questions || !Array.isArray(result.questions)) {
      throw new Error("LLM retornou estrutura sem 'questions[]'");
    }

    return NextResponse.json({
      questions: result.questions.slice(0, 5),
      source: "llm",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const llmError = err instanceof Error ? err.message : "unknown error";
    const stub = stubDiagnostico(body);

    return NextResponse.json({
      questions: stub.questions,
      source: "stub",
      llmError,
      generatedAt: new Date().toISOString(),
    });
  }
}
