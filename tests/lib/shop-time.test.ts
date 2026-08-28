import { DateTime } from 'luxon';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatShopDateTime,
  isBeforeShopToday,
  isFutureInstant,
  shopDayEndUtcIso,
  shopDayStartUtcIso,
  shopToday,
  shopTimezone,
} from '@/lib/shop-time';

describe('shop-time', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads timezone from env', () => {
    vi.stubEnv('VITE_SHOP_TIMEZONE', 'America/Sao_Paulo');
    expect(shopTimezone()).toBe('America/Sao_Paulo');
  });

  it('shopToday uses the shop zone', () => {
    vi.stubEnv('VITE_SHOP_TIMEZONE', 'America/Sao_Paulo');
    // 2024-01-15 02:00 UTC = still 2024-01-14 evening in São Paulo (UTC-3)
    const instant = DateTime.fromISO('2024-01-15T02:00:00.000Z').toJSDate();
    expect(shopToday(instant)).toBe('2024-01-14');
  });

  it('formatShopDateTime converts UTC to shop zone', () => {
    vi.stubEnv('VITE_SHOP_TIMEZONE', 'America/Sao_Paulo');
    expect(formatShopDateTime('2024-06-01T15:30:00.000Z')).toBe('01/06/2024 12:30');
  });

  it('isBeforeShopToday detects overnight sessions', () => {
    vi.stubEnv('VITE_SHOP_TIMEZONE', 'America/Sao_Paulo');
    const now = DateTime.fromISO('2024-06-02T12:00:00', {
      zone: 'America/Sao_Paulo',
    }).toJSDate();
    expect(isBeforeShopToday('2024-06-01T18:00:00.000Z', now)).toBe(true);
    expect(isBeforeShopToday('2024-06-02T10:00:00.000Z', now)).toBe(false);
  });

  it('isFutureInstant rejects past, present and invalid values', () => {
    const now = new Date('2024-06-01T15:30:00.000Z');

    expect(isFutureInstant('2024-06-01T15:31:00.000Z', now)).toBe(true);
    expect(isFutureInstant('2024-06-01T15:30:00.000Z', now)).toBe(false);
    expect(isFutureInstant('2024-06-01T15:29:00.000Z', now)).toBe(false);
    expect(isFutureInstant('invalid', now)).toBe(false);
  });

  it('shop day bounds cover the local calendar day in UTC', () => {
    vi.stubEnv('VITE_SHOP_TIMEZONE', 'America/Sao_Paulo');
    expect(shopDayStartUtcIso('2024-06-01')).toBe('2024-06-01T03:00:00.000Z');
    expect(shopDayEndUtcIso('2024-06-01')).toBe('2024-06-02T02:59:59.999Z');
  });
});
