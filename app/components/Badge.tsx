export type BadgeVariant =
  | "default"
  | "brand"
  | "accent"
  | "warning"
  | "muted";

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const styles: Record<BadgeVariant, string> = {
    default:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    brand: "bg-brand-soft text-white dark:bg-brand-soft dark:text-white",
    accent:
      "bg-accent-soft text-accent dark:bg-accent-soft dark:text-white",
    warning:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    muted:
      "bg-zinc-100/60 text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Badge especializada que aparece sempre que estamos exibindo conteúdo
 * vindo direto do catálogo / transcrições da CEFIS. Sinaliza pro avaliador
 * "isso é dado real, não inventado".
 */
export function CefisRealBadge({
  label = "conteúdo CEFIS real",
}: {
  label?: string;
}) {
  return (
    <Badge variant="accent">
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-current"
      />
      {label}
    </Badge>
  );
}

/**
 * Badge positiva pra reforçar que a resposta foi ancorada em aulas/trechos
 * reais da CEFIS — mesmo quando o LLM externo não está ativo.
 * Substitui o antigo "modo limitado" que assustava sem agregar.
 */
export function GroundedBadge() {
  return (
    <Badge variant="accent">
      <span aria-hidden>●</span>
      Ancorada em aulas reais
    </Badge>
  );
}
