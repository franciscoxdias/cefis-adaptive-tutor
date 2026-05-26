/**
 * Helper server-side: dado um lessonId, busca os metadados de legenda
 * via CEFIS, baixa o WebVTT do S3 público, parseia em segmentos
 * e cacheia o resultado.
 *
 * Usado pelo proxy /api/cefis/subtitles/:lessonId?text=true e pelo
 * /api/tutor/ask pra grounding em transcrição real.
 */

import { cefisFetch } from "./cefis-client";
import { parseVtt, type VttSegment } from "./vtt-parser";

type CefisSubtitleMeta = {
  id: number;
  uuid: string;
  video_id: string;
  language: string;
  title: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type CefisSubtitlesResponse = {
  data: CefisSubtitleMeta[];
};

export type SubtitlesResult = {
  lessonId: number;
  language: string;
  url: string;
  segments: VttSegment[];
  totalDurationSeconds: number;
  segmentCount: number;
  textLength: number;
};

/**
 * Escolhe a melhor legenda disponível: prefere pt-BR, depois pt, depois primeira.
 */
function pickBestSubtitle(
  metas: CefisSubtitleMeta[]
): CefisSubtitleMeta | null {
  if (metas.length === 0) return null;
  const published = metas.filter((m) => m.status === "published");
  const pool = published.length > 0 ? published : metas;
  const ptBR = pool.find((m) => m.language === "pt-BR");
  if (ptBR) return ptBR;
  const pt = pool.find((m) => m.language?.startsWith("pt"));
  if (pt) return pt;
  return pool[0];
}

/**
 * Busca + parseia legenda de uma aula.
 * Throw se aula sem legenda ou fetch falhar.
 */
export async function fetchAndParseSubtitle(
  lessonId: number,
  options: { cacheSeconds?: number } = {}
): Promise<SubtitlesResult> {
  const cacheSeconds = options.cacheSeconds ?? 600;

  // 1. metadata via CEFIS
  const metaResp = await cefisFetch<CefisSubtitlesResponse>({
    version: "v3",
    path: `/lessons/${lessonId}/subtitles`,
    revalidate: cacheSeconds,
  });

  const best = pickBestSubtitle(metaResp.data ?? []);
  if (!best || !best.url) {
    throw new Error(`Aula ${lessonId} não tem legenda publicada.`);
  }

  // 2. baixar VTT do S3 (público, sem auth)
  const vttRes = await fetch(best.url, {
    next: { revalidate: cacheSeconds },
  });

  if (!vttRes.ok) {
    throw new Error(
      `Falha ao baixar VTT da aula ${lessonId}: HTTP ${vttRes.status}`
    );
  }

  const vttText = await vttRes.text();
  const segments = parseVtt(vttText);

  const totalDuration =
    segments.length > 0 ? segments[segments.length - 1].end : 0;
  const textLength = segments.reduce((acc, s) => acc + s.text.length, 0);

  return {
    lessonId,
    language: best.language,
    url: best.url,
    segments,
    totalDurationSeconds: totalDuration,
    segmentCount: segments.length,
    textLength,
  };
}
