import { describe, expect, it } from 'vitest';
import { isShopDefault, specificity } from '@/features/commissions/labels';
import {
  closePeriodSchema,
  createRuleSchema,
  payPeriodSchema,
  recordAdvanceSchema,
  updateRuleSchema,
} from '@/features/commissions/schemas';

function baseRule(overrides: Record<string, unknown> = {}) {
  return {
    barberId: '',
    serviceId: '',
    ratePercent: '40',
    base: 'gross',
    appliesTo: 'services',
    ...overrides,
  };
}

describe('commission rule schemas', () => {
  it('sends the percentage as the fraction the API stores', () => {
    const parsed = createRuleSchema.safeParse(baseRule({ ratePercent: '33,33' }));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.ratePercent).toBe(0.3333);
  });

  it('rejects a rate outside 0–100 or with a third decimal', () => {
    expect(createRuleSchema.safeParse(baseRule({ ratePercent: '120' })).success).toBe(false);
    expect(createRuleSchema.safeParse(baseRule({ ratePercent: '-1' })).success).toBe(false);
    expect(createRuleSchema.safeParse(baseRule({ ratePercent: '40,255' })).success).toBe(false);
  });

  it('accepts the wildcard scope as an empty string', () => {
    const parsed = createRuleSchema.safeParse(baseRule());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.barberId).toBe('');
      expect(parsed.data.serviceId).toBe('');
    }
  });

  it('refuses a service on a products rule, as the API does', () => {
    const parsed = createRuleSchema.safeParse(
      baseRule({ appliesTo: 'products', serviceId: 'a3f1c2d4-0000-4000-8000-000000000000' }),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(['serviceId']);
    }
  });

  it('edits only the rate and the base', () => {
    const parsed = updateRuleSchema.safeParse({
      ratePercent: '50',
      base: 'net',
      barberId: 'ignored',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual({ ratePercent: 0.5, base: 'net' });
  });
});

describe('commission rule precedence', () => {
  it('scores specificity the way the server resolves it', () => {
    expect(specificity({ barberId: 'b', serviceId: 's' })).toBe(3);
    expect(specificity({ barberId: 'b', serviceId: null })).toBe(2);
    expect(specificity({ barberId: null, serviceId: 's' })).toBe(1);
    expect(specificity({ barberId: null, serviceId: null })).toBe(0);
  });

  it('recognises the shop default', () => {
    expect(isShopDefault({ barberId: null, serviceId: null })).toBe(true);
    expect(isShopDefault({ barberId: 'b', serviceId: null })).toBe(false);
  });
});

describe('commission advance schema', () => {
  it('parses money into cents and keeps the method', () => {
    const parsed = recordAdvanceSchema.safeParse({
      barberId: 'a3f1c2d4-0000-4000-8000-000000000000',
      amountText: '150,00',
      paymentMethod: 'cash',
      notes: 'Vale da semana',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.amountText).toBe(15_000);
  });

  it('requires a barber and a positive amount', () => {
    expect(
      recordAdvanceSchema.safeParse({
        barberId: '',
        amountText: '150,00',
        paymentMethod: 'cash',
        notes: '',
      }).success,
    ).toBe(false);

    expect(
      recordAdvanceSchema.safeParse({
        barberId: 'a3f1c2d4-0000-4000-8000-000000000000',
        amountText: '0,00',
        paymentMethod: 'cash',
        notes: '',
      }).success,
    ).toBe(false);
  });
});

describe('close period schema', () => {
  const today = '2026-08-07';

  it('accepts a range that is already over', () => {
    const parsed = closePeriodSchema.safeParse({
      barberId: '',
      startsOn: '2026-07-23',
      endsOn: '2026-08-06',
      today,
    });
    expect(parsed.success).toBe(true);
  });

  it('refuses a range that is still running', () => {
    // Closing a fortnight mid-flight orphans every commission earned in the rest
    // of it: the days sit inside a taken range the overlap rule will never reopen.
    for (const endsOn of [today, '2026-08-20']) {
      const parsed = closePeriodSchema.safeParse({
        barberId: '',
        startsOn: '2026-07-23',
        endsOn,
        today,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) expect(parsed.error.issues[0]?.path).toEqual(['endsOn']);
    }
  });

  it('refuses an inverted range', () => {
    const parsed = closePeriodSchema.safeParse({
      barberId: '',
      startsOn: '2026-08-06',
      endsOn: '2026-07-23',
      today,
    });
    expect(parsed.success).toBe(false);
  });

  it('refuses a malformed date', () => {
    expect(
      closePeriodSchema.safeParse({
        barberId: '',
        startsOn: '23/07/2026',
        endsOn: '2026-08-06',
        today,
      }).success,
    ).toBe(false);
  });
});

describe('pay period schema', () => {
  it('requires a known method', () => {
    expect(payPeriodSchema.safeParse({ paymentMethod: 'cash' }).success).toBe(true);
    expect(payPeriodSchema.safeParse({ paymentMethod: 'bitcoin' }).success).toBe(false);
  });
});
