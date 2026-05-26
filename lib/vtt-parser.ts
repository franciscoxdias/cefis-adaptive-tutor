/**
 * Parser de WebVTT (RFC 8216 / W3C TimedText).
 *
 * Lê uma string WebVTT e devolve segmentos { start, end, text }
 * em segundos numéricos pra busca/contexto.
 *
 * Lida com:
 * - Header WEBVTT (com NOTE opcional)
 * - Cues numerados ou não
 * - Timestamps HH:MM:SS.mmm e MM:SS.mmm
 * - Múltiplas linhas de texto por cue
 *
 * Não trata: cue settings (alignment, position), styling.
 */

export type VttSegment = {
  /** segundo de início */
  start: number;
  /** segundo de fim */
  end: number;
  /** texto do cue (pode conter múltiplas linhas concatenadas com espaço) */
  text: string;
  /** timestamp formatado MM:SS pra exibir */
  timestamp: string;
};

const TIMESTAMP_RE =
  /(\d{1,2}:)?(\d{1,2}):(\d{2})\.(\d{1,3})\s+-->\s+(\d{1,2}:)?(\d{1,2}):(\d{2})\.(\d{1,3})/;

export function parseVtt(content: string): VttSegment[] {
  const segments: VttSegment[] = [];

  // Normaliza line endings
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  let i = 0;

  // Pula header WEBVTT e linhas em branco / NOTE
  while (i < lines.length) {
    const l = lines[i].trim();
    if (l === "" || l.startsWith("WEBVTT") || l.startsWith("NOTE")) {
      i++;
      continue;
    }
    break;
  }

  while (i < lines.length) {
    // Pula linhas em branco entre cues
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    // Pode ter um cue identifier (linha numérica ou string)
    // antes do timestamp. Detectamos pelo próximo match de timestamp.
    let timestampLineIdx = i;
    if (!TIMESTAMP_RE.test(lines[i])) {
      timestampLineIdx = i + 1;
    }

    if (timestampLineIdx >= lines.length) break;

    const m = lines[timestampLineIdx].match(TIMESTAMP_RE);
    if (!m) {
      i = timestampLineIdx + 1;
      continue;
    }

    const start = toSeconds(m[1], m[2], m[3], m[4]);
    const end = toSeconds(m[5], m[6], m[7], m[8]);

    // Coleta linhas de texto até próxima linha em branco
    i = timestampLineIdx + 1;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i].trim());
      i++;
    }

    const text = textLines.join(" ").trim();
    if (text.length > 0) {
      segments.push({
        start,
        end,
        text,
        timestamp: formatTimestamp(start),
      });
    }
  }

  return segments;
}

function toSeconds(
  hourGroup: string | undefined,
  minutes: string,
  seconds: string,
  millis: string
): number {
  const h = hourGroup ? Number(hourGroup.replace(":", "")) : 0;
  const m = Number(minutes);
  const s = Number(seconds);
  const ms = Number(millis.padEnd(3, "0").slice(0, 3)) / 1000;
  return h * 3600 + m * 60 + s + ms;
}

function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Concatena segmentos em texto corrido pra busca textual rápida.
 */
export function segmentsToText(segments: VttSegment[]): string {
  return segments.map((s) => s.text).join(" ");
}

/**
 * Busca textual simples (case-insensitive) por keywords.
 * Devolve segmentos rankeados por nº de matches (desc) + ordem original.
 */
export function searchSegments(
  segments: VttSegment[],
  query: string,
  limit = 5
): Array<VttSegment & { score: number }> {
  const keywords = tokenize(query);
  if (keywords.length === 0) return [];

  const scored = segments.map((seg) => {
    const text = seg.text.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      // count occurrences
      let idx = 0;
      while ((idx = text.indexOf(kw, idx)) !== -1) {
        score++;
        idx += kw.length;
      }
    }
    return { ...seg, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.start - b.start)
    .slice(0, limit);
}

function tokenize(text: string): string[] {
  // Remove stopwords PT-BR básicas e tokens muito curtos
  const STOP = new Set([
    "o","a","os","as","um","uma","de","do","da","dos","das","e","ou","mas","com","para",
    "por","em","no","na","nos","nas","que","se","sua","seu","suas","seus","ao","aos","à",
    "às","isso","esse","essa","esses","essas","é","ser","está","foi","como","mais","muito",
    "pode","quando","onde","qual","quais","sobre","entre","sem","até","só","já","tem"
  ]);
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}
