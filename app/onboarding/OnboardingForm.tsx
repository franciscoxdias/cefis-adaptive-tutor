"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Level = "iniciante" | "intermediario" | "avancado";
type TimePerDay = "10min" | "30min" | "60min" | "120min";
type Experience = "comecando" | "1-3" | "4-7" | "8+" | "lideranca";
type LearningStyle = "visual" | "auditivo" | "leitura" | "pratico" | "misto";

export type OnboardingPayload = {
  name: string;
  area: string;
  experience: Experience;
  objective: string;
  level: Level;
  timePerDay: TimePerDay;
  learningStyle: LearningStyle;
  capturedAt: string; // ISO
};

const AREA_OPTIONS = [
  "Estudante",
  "Analista",
  "Gestor",
  "Empreendedor",
  "Contador",
  "Advogado",
  "Consultor",
  "Outro",
];

const EXPERIENCE_OPTIONS: { value: Experience; label: string }[] = [
  { value: "comecando", label: "Estou começando agora" },
  { value: "1-3", label: "1 a 3 anos de experiência" },
  { value: "4-7", label: "4 a 7 anos de experiência" },
  { value: "8+", label: "8+ anos de experiência" },
  { value: "lideranca", label: "Experiência avançada / liderança" },
];

const LEVEL_OPTIONS: { value: Level; label: string; hint: string }[] = [
  { value: "iniciante", label: "Iniciante", hint: "Pouco ou nenhum contato com o tema" },
  { value: "intermediario", label: "Intermediário", hint: "Já estudei o básico antes" },
  { value: "avancado", label: "Avançado", hint: "Domino o básico e quero aprofundar" },
];

const TIME_OPTIONS: { value: TimePerDay; label: string }[] = [
  { value: "10min", label: "10 minutos por dia" },
  { value: "30min", label: "30 minutos por dia" },
  { value: "60min", label: "1 hora por dia" },
  { value: "120min", label: "Plano intensivo (2h+/dia)" },
];

const STYLE_OPTIONS: { value: LearningStyle; label: string; hint: string }[] = [
  { value: "visual", label: "Visual", hint: "Vídeos, mapas, cards" },
  { value: "auditivo", label: "Auditivo", hint: "Áudio, podcast, narração" },
  { value: "leitura", label: "Leitura", hint: "Resumos, apostilas, guias escritos" },
  { value: "pratico", label: "Prático", hint: "Checklists, exercícios, tarefas" },
  { value: "misto", label: "Misto", hint: "Combinação dos formatos" },
];

const STORAGE_KEY = "cefis-tutor:onboarding";

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState(AREA_OPTIONS[0]);
  const [experience, setExperience] = useState<Experience>("1-3");
  const [objective, setObjective] = useState("");
  const [level, setLevel] = useState<Level>("iniciante");
  const [timePerDay, setTimePerDay] = useState<TimePerDay>("30min");
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("misto");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !objective.trim()) return;
    setSubmitting(true);

    const payload: OnboardingPayload = {
      name: name.trim(),
      area,
      experience,
      objective: objective.trim(),
      level,
      timePerDay,
      learningStyle,
      capturedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage indisponível: segue mesmo assim
    }

    router.push("/diagnostico");
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <Field label="Como devemos te chamar?">
        <input
          type="text"
          name="name"
          autoComplete="given-name"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition focus:border-brand"
          placeholder="Primeiro nome ou apelido"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Sua área ou cargo atual">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition focus:border-brand"
          >
            {AREA_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Experiência profissional">
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value as Experience)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition focus:border-brand"
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Qual o seu objetivo de aprendizagem?"
        hint="Pode ser um exame, um cargo, uma habilidade ou um tópico específico que você quer dominar."
      >
        <textarea
          name="objective"
          required
          maxLength={400}
          rows={3}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition focus:border-brand resize-none"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

      <Field
        label="Como você aprende melhor?"
        hint="O plano e os materiais se adaptam ao formato que mais funciona pra você."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              name="learningStyle"
              value={opt.value}
              checked={learningStyle === opt.value}
              onChange={() => setLearningStyle(opt.value)}
              label={opt.label}
              hint={opt.hint}
            />
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={submitting || !name.trim() || !objective.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 text-base font-bold text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 shadow-glow"
      >
        {submitting ? "Preparando diagnóstico..." : "Próximo: diagnóstico"}
        <span aria-hidden>→</span>
      </button>

      <p className="text-xs text-muted-foreground text-center">
        No MVP, o perfil fica salvo apenas no seu navegador (localStorage).
        Em produção, viria do seu login CEFIS.
      </p>
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
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
          ? "border-brand bg-brand-soft"
          : "border-border hover:border-brand/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-brand"
        />
        <span className="text-base font-medium text-foreground">{label}</span>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground ml-7">{hint}</p>
      )}
    </label>
  );
}
