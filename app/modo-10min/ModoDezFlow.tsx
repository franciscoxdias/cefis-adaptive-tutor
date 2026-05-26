"use client";

import { useEffect, useState } from "react";
import { CefisRealBadge, GroundedBadge } from "../components/Badge";

type Excerpt = {
  courseId: number;
  courseTitle: string;
  lessonId: number;
  lessonTitle: string;
  timestamp: string;
  text: string;
};

type ModoDezResponse = {
  title: string;
  summary: string;
  keyPoints: string[];
  closing: string;
  estimatedReadingMinutes: number;
  topic: string;
  excerpts: Excerpt[];
  source: "llm" | "stub";
  usedSearchTerm?: string | null;
  vttFetches?: number;
};

const ONBOARDING_KEY = "cefis-tutor:onboarding";

const SUGGESTED_TOPICS = [
  "comunicação corporativa",
  "auditoria",
  "contabilidade",
  "direito tributário",
  "liderança",
];

export default function ModoDezFlow() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ModoDezResponse | null>(null);

  // Não pré-popula automaticamente. Deixa o aluno escolher o tópico
  // de forma intencional pra não parecer bug ou "entrada já preenchida".
  // Se quiser reaproveitar o objective do onboarding, oferece como
  // sugestão clicável separada.
  const [suggestedFromOnboarding, setSuggestedFromOnboarding] = useState<
    string | null
  >(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.objective && typeof parsed.objective === "string") {
          setSuggestedFromOnboarding(parsed.objective.slice(0, 80));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = topic.trim();
    if (!t || loading) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/modo-10min/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? `HTTP ${res.status}`);
      }
      setResult(data as ModoDezResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar a síntese.");
    } finally {
      setLoading(false);
    }
  };

  const pickSuggested = (s: string) => {
    setTopic(s);
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Qual tópico você quer absorver em 10 minutos?
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={120}
          placeholder="Ex.: comunicação corporativa, auditoria, liderança..."
          disabled={loading}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
        />

        <div className="flex flex-wrap gap-1.5">
          {suggestedFromOnboarding && (
            <button
              type="button"
              onClick={() => pickSuggested(suggestedFromOnboarding)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full border border-brand text-brand hover:bg-brand hover:text-white transition disabled:opacity-50"
              title="Reaproveitar o objetivo do onboarding"
            >
              ↻ usar meu objetivo
            </button>
          )}
          {SUGGESTED_TOPICS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickSuggested(s)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-base font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {loading ? "Garimpando trechos reais..." : "Gerar síntese de 10 min"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3 items-center justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-sm text-zinc-500">
            Buscando aulas relevantes e extraindo trechos das transcrições...
          </p>
        </div>
      )}

      {result && <ModoDezResult result={result} />}
    </div>
  );
}

function ModoDezResult({ result }: { result: ModoDezResponse }) {
  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <GroundedBadge />
          {result.excerpts.length > 0 ? (
            <CefisRealBadge
              label={`${result.excerpts.length} trechos de ${countDistinctLessons(result.excerpts)} aulas reais`}
            />
          ) : null}
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <span aria-hidden>⏱</span>
            ~{result.estimatedReadingMinutes} min de leitura
          </span>
        </div>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">
          {result.title}
        </h2>
      </header>

      <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
        {result.summary}
      </p>

      {result.keyPoints.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Pontos-chave
          </h3>
          <ol className="flex flex-col gap-3">
            {result.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white shrink-0 dark:bg-white dark:text-zinc-900">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {point}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.excerpts.length > 0 && result.source === "llm" && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Trechos consultados ({result.excerpts.length})
          </h3>
          <ul className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            {result.excerpts.map((e, i) => (
              <li key={i}>
                <span className="opacity-60 mr-1">
                  [aula #{e.lessonId} · {e.timestamp}]
                </span>
                {e.lessonTitle}{" "}
                <span className="opacity-50">— curso {e.courseTitle}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {result.closing}
        </p>
      </footer>
    </article>
  );
}

function countDistinctLessons(excerpts: Excerpt[]): number {
  const ids = new Set(excerpts.map((e) => e.lessonId));
  return ids.size;
}
