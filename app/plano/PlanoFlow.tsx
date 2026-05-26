"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OnboardingPayload } from "../onboarding/OnboardingForm";

type DiagnosticoAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

type PlanStep = {
  order: number;
  title: string;
  description: string;
  type: "course" | "track" | "concept";
  courseId: number | null;
  trackId: number | null;
  estimatedMinutes: number;
};

type Plan = {
  summary: string;
  estimatedTotalMinutes: number;
  steps: PlanStep[];
  catalogSize?: number;
  source?: "llm" | "stub";
};

const ONBOARDING_KEY = "cefis-tutor:onboarding";
const ANSWERS_KEY = "cefis-tutor:diagnostico-answers";
const PLAN_KEY = "cefis-tutor:plan";

export default function PlanoFlow() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const stored = readOnboarding();
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setOnboarding(stored);

    const cached = readPlan();
    if (cached) {
      setPlan(cached);
      setLoading(false);
      return;
    }

    const answers = readAnswers() ?? [];

    (async () => {
      try {
        const res = await fetch("/api/plano/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboarding: stored, answers }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message ?? `HTTP ${res.status}`);
        }

        if (cancelled) return;

        const p = data as Plan;
        if (!Array.isArray(p.steps)) {
          throw new Error("Plano retornado sem etapas.");
        }

        setPlan(p);
        try {
          localStorage.setItem(PLAN_KEY, JSON.stringify(p));
        } catch {
          // ignore
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao montar o plano.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!plan) return <ErrorState message="Sem plano disponível." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {plan.source === "stub" && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200 mb-2">
            modo limitado · sem LLM ativo
          </span>
        )}
        <p className="text-sm text-zinc-800 dark:text-zinc-200">{plan.summary}</p>
        <p className="text-xs text-zinc-500 mt-2">
          Tempo total estimado: ~{plan.estimatedTotalMinutes} min
          {plan.catalogSize !== undefined && (
            <> · {plan.catalogSize} itens consultados no catálogo CEFIS</>
          )}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {plan.steps.map((step) => (
          <li
            key={step.order}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white shrink-0 dark:bg-white dark:text-zinc-900">
                {step.order}
              </span>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <TypeBadge type={step.type} />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
                <p className="text-xs text-zinc-500">
                  ~{step.estimatedMinutes} min
                  {step.type === "course" && step.courseId !== null && (
                    <> · curso CEFIS #{step.courseId}</>
                  )}
                  {step.type === "track" && step.trackId !== null && (
                    <> · trilha CEFIS #{step.trackId}</>
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 mt-4">
        <Link
          href="/tutor"
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-base font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Conversar com o tutor
        </Link>
        <Link
          href="/"
          className="text-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← voltar ao início
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(PLAN_KEY);
            } catch {
              // ignore
            }
            window.location.reload();
          }}
          className="text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          regerar plano
        </button>
      </div>

      {onboarding && (
        <p className="text-xs text-zinc-400 text-center">
          Plano gerado pra {onboarding.name}.
        </p>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: PlanStep["type"] }) {
  const map = {
    course: { label: "Curso CEFIS", cls: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" },
    track: { label: "Trilha CEFIS", cls: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200" },
    concept: { label: "Conceito", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  };
  const m = map[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center py-12">
      <div className="h-6 w-6 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin dark:border-zinc-700 dark:border-t-zinc-100" />
      <p className="text-sm text-zinc-500">
        Consultando o catálogo da CEFIS e montando o plano...
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
      <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
        Não consegui montar o plano
      </h3>
      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
      <p className="text-xs text-red-600 dark:text-red-400 mt-3">
        Verifica se as chaves CEFIS_API_KEY e OPENAI_API_KEY (ou
        ANTHROPIC_API_KEY) estão configuradas no ambiente.
      </p>
    </div>
  );
}

function readOnboarding(): OnboardingPayload | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingPayload;
  } catch {
    return null;
  }
}

function readAnswers(): DiagnosticoAnswer[] | null {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readPlan(): Plan | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.steps || !Array.isArray(parsed.steps)) return null;
    return parsed as Plan;
  } catch {
    return null;
  }
}
