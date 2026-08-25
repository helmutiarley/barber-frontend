import { afterEach, describe, expect, it, vi } from 'vitest';
import { previewCardFeeCents, previewNetCents } from '@/features/payments/fees';
import { recordPaymentsFormSchema, voidPaymentSchema } from '@/features/payments/schemas';
import { activePaidCents } from '@/api/payments';
import type { PaymentDto } from '@/api/types';
import { isSameShopDay } from '@/lib/shop-time';
import { DateTime } from 'luxon';

describe('payment fee preview', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses backend-matching defaults', () => {
    expect(previewCardFeeCents('debit', 10_000)).toBe(150);
    expect(previewCardFeeCents('credit', 10_000)).toBe(350);
    expect(previewCardFeeCents('pix', 10_000)).toBe(0);
    expect(previewNetCents('credit', 10_000)).toBe(9650);
  });

  it('reads rates from env', () => {
    vi.stubEnv('VITE_CARD_FEE_RATE_DEBIT', '0.02');
    expect(previewCardFeeCents('debit', 10_000)).toBe(200);
  });
});

describe('payment schemas', () => {
  it('parses a split batch', () => {
    const parsed = recordPaymentsFormSchema.safeParse({
      lines: [
        { method: 'pix', amountText: '30,00' },
        { method: 'cash', amountText: '15,00' },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.lines.map((l) => l.amountText)).toEqual([3000, 1500]);
    }
  });

  it('requires void reason', () => {
    expect(voidPaymentSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(voidPaymentSchema.safeParse({ reason: 'Digitou errado' }).success).toBe(true);
  });
});

describe('activePaidCents', () => {
  it('ignores voided rows', () => {
    const rows: PaymentDto[] = [
      {
        id: '1',
        appointmentId: 'a',
        amountCents: 3000,
        method: 'pix',
        cardFeeCents: 0,
        netAmountCents: 3000,
        cashRegisterSessionId: null,
        receivedBy: 'u',
        paidAt: '2030-01-01T12:00:00.000Z',
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
      },
      {
        id: '2',
        appointmentId: 'a',
        amountCents: 1000,
        method: 'cash',
        cardFeeCents: 0,
        netAmountCents: 1000,
        cashRegisterSessionId: 's',
        receivedBy: 'u',
        paidAt: '2030-01-01T12:00:00.000Z',
        voidedAt: '2030-01-01T13:00:00.000Z',
        voidedBy: 'u',
        voidReason: 'erro',
      },
    ];
    expect(activePaidCents(rows)).toBe(3000);
  });
});

describe('isSameShopDay', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('compares in the shop zone', () => {
    vi.stubEnv('VITE_SHOP_TIMEZONE', 'America/Sao_Paulo');
    const now = DateTime.fromISO('2024-06-02T12:00:00', {
      zone: 'America/Sao_Paulo',
    }).toJSDate();
    expect(isSameShopDay('2024-06-02T18:00:00.000Z', now)).toBe(true);
    expect(isSameShopDay('2024-06-01T18:00:00.000Z', now)).toBe(false);
  });
});
