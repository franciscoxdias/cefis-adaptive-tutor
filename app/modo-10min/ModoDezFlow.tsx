"use client";

import { useEffect, useState } from "react";
import {
  CefisRealBadge,
  GroundedBadge,
  AIComplementaryBadge,
  CefisRelatedBadge,
} from "../components/Badge";

type Excerpt = {
  courseId: number;
  courseTitle: string;
  lessonId: number;
  lessonTitle: string;
  timestamp: string;
  text: string;
};

type RecommendedSource = {
  title: string;
  type: string;
  note?: string;
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
  coverage?: "cefis" | "cefis-related" | "ai-complementary";
  usedSearchTerm?: string | null;
  vttFetches?: number;
  // Campos extras de aula complementar (presentes quando coverage=ai-complementary)
  objective?: string;
  explanation?: string;
  practicalExample?: string;
  exercise?: string[];
  recommendedSources?: RecommendedSource[];
  advisory?: string;
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
  // Regra unificada: SEM excerpts reais = sempre tratar como complementar.
  // Coverage "cefis-related" (catalog tem cursos mas zero trechos VTT)
  // NÃO ancora a resposta — vira bloco secundário de sugestão.
  const hasExcerpts = result.excerpts.length > 0;
  const isComplementary = !hasExcerpts;

  // Renderiza a estrutura de aula complementar quando NÃO há excerpts e
  // o LLM gerou pelo menos um dos campos extras (objective/explanation/etc).
  const hasComplementaryExtras =
    isComplementary &&
    Boolean(
      result.objective ||
        result.explanation ||
        result.practicalExample ||
        (result.exercise && result.exercise.length > 0) ||
        (result.recommendedSources && result.recommendedSources.length > 0)
    );

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge principal: ancorada se há trechos · complementar IA se não */}
          {hasExcerpts ? (
            <>
              <GroundedBadge />
              <CefisRealBadge
                label={`${result.excerpts.length} trechos de ${countDistinctLessons(result.excerpts)} aulas reais`}
              />
            </>
          ) : (
            <AIComplementaryBadge />
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span aria-hidden>⏱</span>
            ~{result.estimatedReadingMinutes} min de leitura
          </span>
        </div>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">
          {result.title}
        </h2>
      </header>

      <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {result.summary}
      </p>

      {/* Estrutura de aula complementar — só quando ai-complementary + LLM ativo */}
      {hasComplementaryExtras && (
        <div className="glow-card rounded-xl p-5 sm:p-6 flex flex-col gap-5 border-l-2 border-l-accent">
          <div className="flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
            <span aria-hidden>✦</span>
            Aula complementar personalizada gerada por IA
          </div>

          {result.objective && (
            <Section number={1} title="Objetivo da aula">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {result.objective}
              </p>
            </Section>
          )}

          {result.explanation && (
            <Section number={2} title="Explicação estruturada">
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {result.explanation}
              </div>
            </Section>
          )}

          {result.keyPoints.length > 0 && (
            <Section number={3} title="Pontos-chave">
              <ul className="flex flex-col gap-2">
                {result.keyPoints.map((p, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/90 leading-relaxed flex gap-2"
                  >
                    <span aria-hidden className="text-brand shrink-0">
                      ▸
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.practicalExample && (
            <Section number={4} title="Exemplo prático">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {result.practicalExample}
              </p>
            </Section>
          )}

          {result.exercise && result.exercise.length > 0 && (
            <Section number={5} title="Exercício / Checklist">
              <ul className="flex flex-col gap-2">
                {result.exercise.map((e, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/90 leading-relaxed flex gap-2"
                  >
                    <span aria-hidden className="text-accent shrink-0 mt-0.5">
                      ☐
                    </span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {result.recommendedSources && result.recommendedSources.length > 0 && (
            <Section number={6} title="Fontes recomendadas para validação">
              <ul className="flex flex-col gap-2">
                {result.recommendedSources.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-foreground">
                      {s.title}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}· {s.type}
                    </span>
                    {s.note && (
                      <span className="text-muted-foreground/80 block text-xs mt-0.5">
                        {s.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Fontes amplamente reconhecidas, sugeridas como ponto de partida
                para validação independente. O sistema não consulta esses
                materiais automaticamente.
              </p>
            </Section>
          )}

          {result.advisory && (
            <Section number={7} title="Aviso / limitação honesta">
              <div className="flex gap-2 text-xs text-muted-foreground items-start rounded-lg bg-card/40 p-3 border border-border">
                <span aria-hidden className="text-accent shrink-0 mt-0.5">
                  ⚠
                </span>
                <p className="leading-relaxed">{result.advisory}</p>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Bloco secundário: "Conteúdos CEFIS relacionados" quando coverage=cefis-related
          mas sem grounding direto. NUNCA aparece como ancoragem principal. */}
      {isComplementary && result.coverage === "cefis-related" && (
        <div className="rounded-xl border border-border bg-card/40 p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CefisRelatedBadge />
            <span className="text-xs text-muted-foreground">
              (sugestão · sem cobertura direta)
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O catálogo CEFIS retornou cursos próximos ao tema buscado, mas
            sem trechos diretamente relacionados nas legendas. Explore-os no
            painel da CEFIS se quiser conteúdo oficial adjacente.
          </p>
        </div>
      )}

      {/* Modo CEFIS grounded — mantém layout original com keyPoints */}
      {!hasComplementaryExtras && result.keyPoints.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pontos-chave
          </h3>
          <ol className="flex flex-col gap-3">
            {result.keyPoints.map((point, i) => (
              <li key={i} className="glow-card flex gap-3 rounded-lg p-4">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {point}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.excerpts.length > 0 && result.source === "llm" && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Trechos consultados ({result.excerpts.length})
          </h3>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
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

      <footer className="glow-card rounded-lg p-5">
        <p className="text-sm text-foreground/90">{result.closing}</p>
      </footer>
    </article>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand text-[10px] font-bold shrink-0">
          {number}
        </span>
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function countDistinctLessons(excerpts: Excerpt[]): number {
  const ids = new Set(excerpts.map((e) => e.lessonId));
  return ids.size;
}
