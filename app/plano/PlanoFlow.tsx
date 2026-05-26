"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OnboardingPayload } from "../onboarding/OnboardingForm";
import { CefisRealBadge, GroundedBadge } from "../components/Badge";
import { humanizeMinutes, paceEstimate } from "@/lib/format";

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
    <div className="flex flex-col gap-6 fade-in">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap gap-2 mb-3">
          <GroundedBadge />
          {plan.catalogSize !== undefined && plan.catalogSize > 0 ? (
            <CefisRealBadge
              label={`${plan.catalogSize} itens do catálogo consultados`}
            />
          ) : null}
        </div>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
          {plan.summary}
        </p>
        <div className="text-xs text-zinc-500 mt-3 flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span aria-hidden>⏱</span>
            Tempo total estimado: {humanizeMinutes(plan.estimatedTotalMinutes)}
          </span>
          {onboarding?.timePerDay
            ? (() => {
                const pace = paceEstimate(
                  plan.estimatedTotalMinutes,
                  onboarding.timePerDay
                );
                return pace ? (
                  <span className="text-zinc-400">{pace}</span>
                ) : null;
              })()
            : null}
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {plan.steps.map((step) => (
          <li
            key={step.order}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-brand dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-brand"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shrink-0">
                {step.order}
              </span>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <TypeBadge type={step.type} />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
                <p className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span aria-hidden>⏱</span>
                    {humanizeMinutes(step.estimatedMinutes)}
                  </span>
                  {step.type === "course" && step.courseId !== null && (
                    <span className="opacity-70">· curso CEFIS #{step.courseId}</span>
                  )}
                  {step.type === "track" && step.trackId !== null && (
                    <span className="opacity-70">· trilha CEFIS #{step.trackId}</span>
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
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 text-base font-medium text-white shadow-lg shadow-brand/20 transition hover:bg-brand-soft hover:shadow-xl"
        >
          Conversar com o tutor
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </Link>
        <Link
          href="/modo-10min"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:hover:border-brand"
        >
          <span aria-hidden>⚡</span>
          Ver síntese 10 min de um tópico
        </Link>
        <div className="flex items-center justify-between mt-1">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-foreground transition"
          >
            ← início
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
            className="text-xs text-zinc-400 hover:text-zinc-700 transition dark:hover:text-zinc-300"
          >
            regerar plano
          </button>
        </div>
      </div>

      {onboarding && (
        <p className="text-xs text-zinc-400 text-center mt-2">
          Plano gerado pra {onboarding.name}.
        </p>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: PlanStep["type"] }) {
  const map = {
    course: {
      label: "Curso CEFIS",
      cls: "bg-brand-soft text-white dark:bg-brand-soft",
    },
    track: {
      label: "Trilha CEFIS",
      cls: "bg-accent-soft text-accent dark:bg-accent-soft dark:text-white",
    },
    concept: {
      label: "Conceito",
      cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    },
  };
  const m = map[type];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${m.cls}`}
    >
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
