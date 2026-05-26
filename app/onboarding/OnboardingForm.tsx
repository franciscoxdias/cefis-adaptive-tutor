"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Level = "iniciante" | "intermediario" | "avancado";
type TimePerDay = "10min" | "30min" | "60min" | "120min";

export type OnboardingPayload = {
  name: string;
  objective: string;
  level: Level;
  timePerDay: TimePerDay;
  capturedAt: string; // ISO
};

const LEVEL_OPTIONS: { value: Level; label: string; hint: string }[] = [
  { value: "iniciante", label: "Iniciante", hint: "Pouco ou nenhum contato com o tema" },
  { value: "intermediario", label: "Intermediário", hint: "Já estudei o básico antes" },
  { value: "avancado", label: "Avançado", hint: "Domino o básico e quero aprofundar" },
];

const TIME_OPTIONS: { value: TimePerDay; label: string }[] = [
  { value: "10min", label: "10 minutos por dia" },
  { value: "30min", label: "30 minutos por dia" },
  { value: "60min", label: "1 hora por dia" },
  { value: "120min", label: "2 horas ou mais por dia" },
];

const STORAGE_KEY = "cefis-tutor:onboarding";

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState<Level>("iniciante");
  const [timePerDay, setTimePerDay] = useState<TimePerDay>("30min");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !objective.trim()) return;
    setSubmitting(true);

    const payload: OnboardingPayload = {
      name: name.trim(),
      objective: objective.trim(),
      level,
      timePerDay,
      capturedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage indisponível (privado, quota): segue mesmo assim
    }

    router.push("/diagnostico");
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <Field label="Como você quer ser chamado?">
        <input
          type="text"
          name="name"
          autoComplete="given-name"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
          placeholder="Primeiro nome"
        />
      </Field>

      <Field
        label="Qual o seu objetivo?"
        hint="Pode ser um exame, um cargo, uma habilidade ou um tópico específico que você quer dominar."
      >
        <textarea
          name="objective"
          required
          maxLength={400}
          rows={4}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100 resize-none"
          placeholder="Ex.: passar no exame X, virar gerente de Y, entender Z em 30 dias..."
        />
      </Field>

      <Field label="Qual o seu nível atual no tema?">
        <div className="flex flex-col gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              name="level"
              value={opt.value}
              checked={level === opt.value}
              onChange={() => setLevel(opt.value)}
              label={opt.label}
              hint={opt.hint}
            />
          ))}
        </div>
      </Field>

      <Field label="Quanto tempo você tem por dia?">
        <div className="flex flex-col gap-2">
          {TIME_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              name="timePerDay"
              value={opt.value}
              checked={timePerDay === opt.value}
              onChange={() => setTimePerDay(opt.value)}
              label={opt.label}
            />
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={submitting || !name.trim() || !objective.trim()}
        className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-base font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {submitting ? "Preparando diagnóstico..." : "Próximo: diagnóstico"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {children}
    </div>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <label
      className={`flex flex-col gap-1 rounded-lg border px-4 py-3 cursor-pointer transition ${
        checked
          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
          : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
        />
        <span className="text-base font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
      </div>
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-7">{hint}</p>
      )}
    </label>
  );
}
