import { NextRequest, NextResponse } from "next/server";
import { cefisFetch } from "@/lib/cefis-client";

/**
 * GET /api/cefis/subtitles/:lessonId
 *
 * Proxy server-side para CEFIS v3 GET /lessons/:lessonId/subtitles.
 * Retorna o objeto JSON cru da CEFIS (schema ainda em validação).
 *
 * Quando o schema do response estiver confirmado, este proxy será
 * tipado e o conteúdo poderá ser usado como contexto pelo /api/tutor/ask
 * para responder perguntas ancoradas em transcrição real de aula.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await ctx.params;

  // Validação: lessonId precisa ser inteiro positivo
  const id = Number(lessonId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      {
        error: "invalid_lesson_id",
        message: "lessonId deve ser um inteiro positivo.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await cefisFetch<unknown>({
      version: "v3",
      path: `/lessons/${id}/subtitles`,
      revalidate: 600, // 10min — subtitles raramente mudam
    });

    return NextResponse.json({
      lessonId: id,
      data: result,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      {
        error: "subtitles_failed",
        lessonId: id,
        message,
      },
      { status: 502 }
    );
  }
}
