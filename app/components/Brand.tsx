import Link from "next/link";

/**
 * Logo + wordmark CEFIS Compass · Adaptive Learning Tutor.
 * Símbolo: ícone bússola estilizado (SVG inline, sem dependência externa).
 */
export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const boxSize =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const textSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  const subTextSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-foreground hover:opacity-80 transition"
      aria-label="CEFIS Compass · Voltar ao início"
    >
      <span
        className={`${boxSize} relative flex items-center justify-center rounded-xl border border-brand/40 bg-gradient-to-br from-brand/30 to-accent/20`}
        style={{
          boxShadow: "0 0 15px -3px oklch(0.705 0.191 165.57 / 30%)",
        }}
        aria-hidden
      >
        <CompassIcon className={`${iconSize} text-brand`} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`${textSize} font-bold tracking-tight`}>
          CEFIS <span className="text-brand">Compass</span>
        </span>
        <span
          className={`${subTextSize} font-normal text-muted-foreground`}
        >
          Adaptive Learning Tutor
        </span>
      </span>
    </Link>
  );
}

function CompassIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
