import { DateTime } from 'luxon';
import type { RevenueGrouping } from '@/api/types';
import { formatRate } from '@/features/commissions/rate';
import { formatMoney } from '@/lib/money';
import { formatCalendarDate } from '@/features/reports/range';

/** A rate the API could not compute is a dash, never a zero — they mean different things. */
export function formatRateOrDash(rate: number | null): string {
  return rate === null ? '—' : formatRate(rate);
}

export function formatMoneyOrDash(cents: number | null): string {
  return cents === null ? '—' : formatMoney(cents);
}

/** `510` → `8h 30min`, because a report of raw minutes is a report nobody reads. */
export function formatMinutes(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
};

/**
 * What a bucket is called. Time buckets carry a date in their key; `barber` and
 * `service` carry a display name in `label`; a null key is revenue that cannot be
 * attributed, which the report names rather than hides — filtering it out would
 * make the buckets stop summing to the total.
 */
export function bucketLabel(
  bucket: { key: string | null; label: string | null },
  groupBy: RevenueGrouping,
): string {
  if (bucket.key === null) {
    return groupBy === 'barber' ? 'Venda da casa' : 'Sem serviço (produtos)';
  }

  switch (groupBy) {
    case 'day':
      return formatCalendarDate(bucket.key);
    case 'week':
      return `Semana de ${formatCalendarDate(bucket.key)}`;
    case 'month': {
      const parsed = DateTime.fromISO(bucket.key).setLocale('pt-BR');
      return parsed.isValid ? capitalize(parsed.toFormat('LLLL yyyy')) : bucket.key;
    }
    case 'method':
      return METHOD_LABELS[bucket.key] ?? bucket.key;
    case 'barber':
    case 'service':
    default:
      return bucket.label ?? `${bucket.key.slice(0, 8)}…`;
  }
}

/** A bucket's share of the whole, for the inline bars on the revenue table. */
export function shareOf(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
