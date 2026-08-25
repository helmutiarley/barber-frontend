/** Weekday 0 = Sunday … 6 = Saturday (JS `Date#getDay`). */
export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

/** Trim API `HH:MM:SS` down to `HH:MM` for form fields. */
export function toHhMm(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 5);
}
