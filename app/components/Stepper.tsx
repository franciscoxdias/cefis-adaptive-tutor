type StepperProps = {
  current: 1 | 2 | 3;
};

const STEPS: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: "Onboarding" },
  { id: 2, label: "Diagnóstico" },
  { id: 3, label: "Plano" },
];

export function Stepper({ current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progresso da jornada">
      {STEPS.map((s, idx) => {
        const isActive = s.id === current;
        const isDone = s.id < current;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                isActive
                  ? "bg-brand text-white"
                  : isDone
                    ? "bg-accent text-white"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {isDone ? "✓" : s.id}
            </span>
            <span
              className={`text-xs ${
                isActive
                  ? "font-semibold text-foreground"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`mx-1 h-px w-4 ${
                  isDone ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
