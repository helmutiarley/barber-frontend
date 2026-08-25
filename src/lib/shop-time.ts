import { DateTime } from 'luxon';

export function shopTimezone(): string {
  return import.meta.env.VITE_SHOP_TIMEZONE || 'America/Sao_Paulo';
}

/** Shop-local calendar date as `YYYY-MM-DD`. */
export function shopToday(now: Date = new Date()): string {
  return DateTime.fromJSDate(now, { zone: shopTimezone() }).toISODate()!;
}

/** Format a UTC ISO instant for display in the shop zone. */
export function formatShopDateTime(iso: string, format = 'dd/MM/yyyy HH:mm'): string {
  const dt = DateTime.fromISO(iso, { zone: 'utc' }).setZone(shopTimezone());
  if (!dt.isValid) {
    return iso;
  }

  return dt.toFormat(format);
}

/**
 * Build a UTC ISO instant from a shop-local calendar date (`YYYY-MM-DD`) and
 * wall-clock time (`HH:MM` or `HH:MM:SS`).
 */
export function shopLocalToUtcIso(date: string, time: string): string {
  const normalized = time.length === 5 ? `${time}:00` : time;
  const dt = DateTime.fromISO(`${date}T${normalized}`, { zone: shopTimezone() });
  if (!dt.isValid) {
    throw new Error(`Invalid shop-local datetime: ${date} ${time}`);
  }

  return dt.toUTC().toISO()!;
}

/** Inclusive start of a shop-local calendar day, as UTC ISO. */
export function shopDayStartUtcIso(date: string): string {
  return DateTime.fromISO(date, { zone: shopTimezone() }).startOf('day').toUTC().toISO()!;
}

/** Inclusive end of a shop-local calendar day, as UTC ISO. */
export function shopDayEndUtcIso(date: string): string {
  return DateTime.fromISO(date, { zone: shopTimezone() }).endOf('day').toUTC().toISO()!;
}

/** True when `iso` falls on the shop-local calendar day of `now`. */
export function isSameShopDay(iso: string, now: Date = new Date()): boolean {
  const day = DateTime.fromISO(iso, { zone: 'utc' }).setZone(shopTimezone()).toISODate();
  if (!day) {
    return false;
  }

  return day === shopToday(now);
}

/** True when the instant falls on a shop-local calendar day before today. */
export function isBeforeShopToday(iso: string, now: Date = new Date()): boolean {
  const openedDay = DateTime.fromISO(iso, { zone: 'utc' }).setZone(shopTimezone()).toISODate();
  if (!openedDay) {
    return false;
  }

  return openedDay < shopToday(now);
}
