import Link from "next/link";

/**
 * Logo + wordmark CEFIS Compass · Adaptive Learning Tutor.
 * Símbolo: 3 barras crescentes representando progresso adaptativo
 * — também evocando uma bússola que aponta o caminho.
 */
export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const subTextSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-foreground hover:opacity-80 transition"
      aria-label="CEFIS Compass · Voltar ao início"
    >
      <span
        className={`${dims} inline-flex items-end gap-[3px] rounded-md bg-brand p-1.5`}
        aria-hidden
      >
        <span className="h-[40%] w-1 rounded-sm bg-white/50" />
        <span className="h-[65%] w-1 rounded-sm bg-white/75" />
        <span className="h-[95%] w-1 rounded-sm bg-white" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`${textSize} font-semibold tracking-tight`}>
          CEFIS Compass
        </span>
        <span
          className={`${subTextSize} font-normal text-zinc-500 dark:text-zinc-400`}
        >
          Adaptive Learning Tutor
        </span>
      </span>
    </Link>
  );
}
