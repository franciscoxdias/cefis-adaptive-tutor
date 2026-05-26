import { NextRequest, NextResponse } from "next/server";
import { cefisFetch } from "@/lib/cefis-client";
import { fetchAndParseSubtitle } from "@/lib/subtitles-fetcher";

/**
 * GET /api/cefis/subtitles/:lessonId
 *
 * Default: proxy do response cru da CEFIS /lessons/:id/subtitles
 *          (metadados: id, uuid, video_id, language, url, status, ...).
 *
 * Query `?text=true`: baixa o WebVTT real do S3, parseia em segmentos
 *                     { start, end, text, timestamp } e devolve junto.
 *                     Útil pra grounding em transcrição real.
 *
 * Query `?text=true&q=keyword`: além do texto completo, devolve top 5
 *                               segmentos que casam com a query.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await ctx.params;
  const id = Number(lessonId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "invalid_lesson_id", message: "lessonId deve ser inteiro positivo." },
      { status: 400 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const withText = sp.get("text") === "true" || sp.get("text") === "1";
  const query = sp.get("q") ?? null;

  if (!withText) {
    // Modo default: só metadata via proxy direto
    try {
      const result = await cefisFetch<unknown>({
        version: "v3",
        path: `/lessons/${id}/subtitles`,
        revalidate: 600,
      });
      return NextResponse.json({
        lessonId: id,
        data: result,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      return NextResponse.json(
        { error: "subtitles_failed", lessonId: id, message },
        { status: 502 }
      );
    }
  }

  // Modo expandido: metadata + VTT parseado + busca opcional
  try {
    const parsed = await fetchAndParseSubtitle(id);

    // Busca opcional via keyword
    let matches:
      | Array<{
          start: number;
          end: number;
          text: string;
          timestamp: string;
          score: number;
        }>
      | undefined;

    if (query && query.trim().length > 0) {
      const { searchSegments } = await import("@/lib/vtt-parser");
      matches = searchSegments(parsed.segments, query.trim(), 5);
    }

    return NextResponse.json({
      lessonId: id,
      language: parsed.language,
      url: parsed.url,
      totalDurationSeconds: parsed.totalDurationSeconds,
      segmentCount: parsed.segmentCount,
      textLength: parsed.textLength,
      segments: parsed.segments,
      matches,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "subtitles_text_failed", lessonId: id, message },
      { status: 502 }
    );
  }
}
