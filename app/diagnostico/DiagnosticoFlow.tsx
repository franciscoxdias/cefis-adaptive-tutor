"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OnboardingPayload } from "../onboarding/OnboardingForm";

type Question = { id: string; question: string; why: string };

type DiagnosticoAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

const ONBOARDING_KEY = "cefis-tutor:onboarding";
const ANSWERS_KEY = "cefis-tutor:diagnostico-answers";
const QUESTIONS_KEY = "cefis-tutor:diagnostico-questions";

export default function DiagnosticoFlow() {
  const router = useRouter();
  const [onboarding, setOnboarding] = useState<OnboardingPayload | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const stored = readOnboarding();
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setOnboarding(stored);

    // Tenta recuperar perguntas em cache (recarregar a página não regenera)
    const cached = readQuestions();
    if (cached) {
      setQuestions(cached);
      setAnswers(readAnswers() ?? {});
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/diagnostico/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stored),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message ?? `HTTP ${res.status}`);
        }

        if (cancelled) return;

        const qs: Question[] = Array.isArray(data?.questions) ? data.questions : [];
        if (qs.length === 0) {
          throw new Error("Não recebi perguntas do tutor.");
        }

        setQuestions(qs);
        try {
          localStorage.setItem(QUESTIONS_KEY, JSON.stringify(qs));
        } catch {
          // ignore
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao gerar diagnóstico.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const allAnswered =
    questions !== null &&
    questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered || !questions) return;
    setSubmitting(true);

    const out: DiagnosticoAnswer[] = questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: answers[q.id].trim(),
    }));

    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(out));
    } catch {
      // ignore
    }

    router.push("/plano");
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!questions || questions.length === 0) {
    return <ErrorState message="Sem perguntas geradas. Tenta novamente." />;
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <p className="text-sm text-zinc-500">
        Responda com o que você já sabe. Não precisa estar certo — o tutor usa
        suas respostas pra mapear lacunas e personalizar o plano.
      </p>

      {questions.map((q, idx) => (
        <div key={q.id} className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <span className="text-zinc-500 mr-2">{idx + 1}.</span>
            {q.question}
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{q.why}</p>
          <textarea
            rows={3}
            maxLength={500}
            value={answers[q.id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100 resize-none"
            placeholder="Sua resposta..."
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={!allAnswered || submitting}
        className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-base font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {submitting ? "Montando plano..." : "Próximo: meu plano"}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        Olá {onboarding?.name}, este diagnóstico foi gerado com base no seu
        objetivo.
      </p>
    </form>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center py-12">
      <div className="h-6 w-6 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin dark:border-zinc-700 dark:border-t-zinc-100" />
      <p className="text-sm text-zinc-500">
        Gerando perguntas adaptadas ao seu objetivo...
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
      <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
        Não consegui gerar o diagnóstico
      </h3>
      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
      <p className="text-xs text-red-600 dark:text-red-400 mt-3">
        Isso pode acontecer se a chave do LLM ainda não foi configurada no
        ambiente. Tenta recarregar a página em alguns instantes.
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

function readQuestions(): Question[] | null {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readAnswers(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const map: Record<string, string> = {};
    for (const a of parsed) {
      if (a && typeof a.questionId === "string" && typeof a.answer === "string") {
        map[a.questionId] = a.answer;
      }
    }
    return map;
  } catch {
    return null;
  }
}
