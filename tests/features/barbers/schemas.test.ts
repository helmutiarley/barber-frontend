import { describe, expect, it } from 'vitest';
import {
  createBarberSchema,
  createBlockSchema,
  replaceScheduleSchema,
  scheduleFieldErrorsFromZod,
} from '@/features/barbers/schemas';
import { toHhMm } from '@/features/barbers/weekdays';
import { shopLocalToUtcIso } from '@/lib/shop-time';

describe('barbers schemas', () => {
  it('accepts a create payload with comma-separated specialties', () => {
    const parsed = createBarberSchema.safeParse({
      userId: '11111111-1111-4111-8111-111111111111',
      displayName: 'Rafael',
      photoUrl: '',
      specialtiesText: 'fade, barba',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.specialtiesText).toEqual(['fade', 'barba']);
    }
  });

  it('rejects an empty display name', () => {
    const parsed = createBarberSchema.safeParse({
      userId: '11111111-1111-4111-8111-111111111111',
      displayName: '  ',
      photoUrl: '',
      specialtiesText: '',
    });

    expect(parsed.success).toBe(false);
  });

  it('requires HH:MM on enabled schedule days and allows closed days', () => {
    const days = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      enabled: weekday === 1,
      startTime: weekday === 1 ? '09:00' : '',
      endTime: weekday === 1 ? '18:00' : '',
      hasBreak: false,
      breakStart: '',
      breakEnd: '',
    }));

    expect(replaceScheduleSchema.safeParse({ days }).success).toBe(true);

    days[1]!.endTime = '08:00';
    const invalid = replaceScheduleSchema.safeParse({ days });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      const errors = scheduleFieldErrorsFromZod(invalid.error);
      expect(errors['days.1.endTime']).toBeTruthy();
    }
  });

  it('rejects a block whose end is not after start', () => {
    const parsed = createBlockSchema.safeParse({
      date: '2026-08-10',
      startTime: '14:00',
      endTime: '14:00',
      reason: '',
    });

    expect(parsed.success).toBe(false);
  });
});

describe('barbers time helpers', () => {
  it('trims API HH:MM:SS to HH:MM', () => {
    expect(toHhMm('09:00:00')).toBe('09:00');
    expect(toHhMm(null)).toBe('');
  });

  it('converts shop-local wall time to a UTC ISO instant', () => {
    const iso = shopLocalToUtcIso('2026-08-10', '09:00');
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // America/Sao_Paulo is UTC-3 year-round today.
    expect(iso).toBe('2026-08-10T12:00:00.000Z');
  });
});
