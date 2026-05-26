/**
 * Helpers de formatação humanizada pra UI.
 */

/**
 * Converte minutos em string amigável.
 * Exemplos:
 *  30      → "~30 min"
 *  90      → "~1h30"
 *  240     → "~4 horas"
 *  6859    → "~114 horas"
 */
export function humanizeMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "~0 min";

  if (totalMinutes < 60) {
    return `~${Math.round(totalMinutes)} min`;
  }

  if (totalMinutes < 600) {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (m === 0) {
      return `~${h}h`;
    }
    return `~${h}h${String(m).padStart(2, "0")}`;
  }

  // >= 10 horas: arredonda pra hora cheia
  const hours = Math.round(totalMinutes / 60);
  return `~${hours} horas`;
}

/**
 * Dado total de minutos do plano + minutos por dia disponível,
 * estima quantos dias / semanas o plano vai durar.
 *
 * Devolve string tipo "≈23 semanas no ritmo de 30 min/dia"
 * ou null se não der pra estimar.
 */
export function paceEstimate(
  totalMinutes: number,
  timePerDay: "10min" | "30min" | "60min" | "120min" | undefined | null
): string | null {
  if (!timePerDay) return null;
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return null;

  const perDay: Record<string, number> = {
    "10min": 10,
    "30min": 30,
    "60min": 60,
    "120min": 120,
  };
  const daily = perDay[timePerDay];
  if (!daily) return null;

  const days = Math.ceil(totalMinutes / daily);
  const label = timePerDay.replace("min", " min/dia");

  if (days < 7) {
    return `≈${days} ${days === 1 ? "dia" : "dias"} no ritmo de ${label}`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 12) {
    return `≈${weeks} ${weeks === 1 ? "semana" : "semanas"} no ritmo de ${label}`;
  }

  const months = Math.round(days / 30);
  return `≈${months} ${months === 1 ? "mês" : "meses"} no ritmo de ${label}`;
}
