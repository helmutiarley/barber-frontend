/**
 * The API speaks fractions (`0.4` is 40%) with at most four decimals, because
 * the column is `numeric(5,4)`. The UI speaks percent, so a percentage carries
 * at most two. Both conversions round rather than divide, or `40.1 / 100` would
 * arrive as `0.40100000000000002` and lose the fifth-decimal check.
 */
export function percentToRate(percent: number): number {
  return Math.round(percent * 100) / 10_000;
}

export function rateToPercent(rate: number): number {
  return Math.round(rate * 10_000) / 100;
}

/** True when the percentage fits the column: two decimals, 0–100. */
export function fitsPercentScale(percent: number): boolean {
  if (!Number.isFinite(percent)) return false;
  return Math.abs(percent * 100 - Math.round(percent * 100)) < 1e-9;
}

/** `0.4` → `40%`, trimming a trailing `,00`. */
export function formatRate(rate: number): string {
  const percent = rateToPercent(rate);
  const text = Number.isInteger(percent)
    ? String(percent)
    : percent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${text}%`;
}

/** Parses a typed percentage, accepting a comma decimal separator. */
export function parsePercentInput(value: string): number {
  const normalized = value.trim().replace('%', '').replace(',', '.');
  if (normalized === '') {
    throw new Error('Empty percentage');
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid percentage: ${value}`);
  }

  return parsed;
}
