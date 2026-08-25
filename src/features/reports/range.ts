import { DateTime } from 'luxon';
import { shopTimezone, shopToday } from '@/lib/shop-time';

export type ReportRange = { from: string; to: string };

export type RangePreset = 'this-month' | 'last-month' | 'last-7' | 'last-30' | 'this-year';

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  'this-month': 'Este mês',
  'last-month': 'Mês passado',
  'last-7': 'Últimos 7 dias',
  'last-30': 'Últimos 30 dias',
  'this-year': 'Este ano',
};

export const RANGE_PRESETS: RangePreset[] = [
  'this-month',
  'last-month',
  'last-7',
  'last-30',
  'this-year',
];

/** The API's own default, mirrored here so the picker opens on what it would return. */
export function currentMonthRange(today = shopToday()): ReportRange {
  const start = DateTime.fromISO(today, { zone: shopTimezone() });
  return { from: start.startOf('month').toISODate()!, to: start.endOf('month').toISODate()! };
}

export function rangeForPreset(preset: RangePreset, today = shopToday()): ReportRange {
  const day = DateTime.fromISO(today, { zone: shopTimezone() });

  switch (preset) {
    case 'last-month': {
      const previous = day.minus({ months: 1 });
      return {
        from: previous.startOf('month').toISODate()!,
        to: previous.endOf('month').toISODate()!,
      };
    }
    // Inclusive of today, so "7 days" counts back six.
    case 'last-7':
      return { from: day.minus({ days: 6 }).toISODate()!, to: today };
    case 'last-30':
      return { from: day.minus({ days: 29 }).toISODate()!, to: today };
    case 'this-year':
      return { from: day.startOf('year').toISODate()!, to: day.endOf('year').toISODate()! };
    case 'this-month':
    default:
      return currentMonthRange(today);
  }
}

/** Which preset a range is, so the buttons can show what is selected. */
export function presetForRange(range: ReportRange, today = shopToday()): RangePreset | null {
  return (
    RANGE_PRESETS.find((preset) => {
      const candidate = rangeForPreset(preset, today);
      return candidate.from === range.from && candidate.to === range.to;
    }) ?? null
  );
}

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads the range out of the URL so a report can be linked to, falling back to the
 * current month when either end is missing or malformed.
 */
export function rangeFromQuery(
  query: Record<string, unknown>,
  today = shopToday(),
): ReportRange {
  const fallback = currentMonthRange(today);
  const from = typeof query.from === 'string' && CALENDAR_DATE.test(query.from) ? query.from : null;
  const to = typeof query.to === 'string' && CALENDAR_DATE.test(query.to) ? query.to : null;

  return { from: from ?? fallback.from, to: to ?? fallback.to };
}

/** The message a picker shows instead of asking the API for a range it will refuse. */
export function rangeError(range: ReportRange): string | null {
  if (!CALENDAR_DATE.test(range.from) || !CALENDAR_DATE.test(range.to)) {
    return 'Informe datas válidas.';
  }
  if (!DateTime.fromISO(range.from).isValid || !DateTime.fromISO(range.to).isValid) {
    return 'Informe datas válidas.';
  }
  if (range.to < range.from) {
    return 'A data final deve ser depois da inicial.';
  }
  return null;
}

/** `2026-08-01`–`2026-08-31` → `01/08/2026 – 31/08/2026`. */
export function formatRange(range: ReportRange): string {
  return `${formatCalendarDate(range.from)} – ${formatCalendarDate(range.to)}`;
}

export function formatCalendarDate(date: string): string {
  const parsed = DateTime.fromISO(date);
  return parsed.isValid ? parsed.toFormat('dd/MM/yyyy') : date;
}
