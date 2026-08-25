import { describe, expect, it } from 'vitest';
import { resolveManualKind } from '@/features/cash-register/labels';
import {
  closeSessionFormSchema,
  manualMovementSchema,
  openSessionSchema,
} from '@/features/cash-register/schemas';

describe('cash-register schemas', () => {
  it('accepts zero opening balance', () => {
    const parsed = openSessionSchema.safeParse({ openingBalanceText: '0,00' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.openingBalanceText).toBe(0);
  });

  it('requires notes when counted differs from expected', () => {
    expect(
      closeSessionFormSchema.safeParse({
        countedBalanceText: '100,00',
        notes: '',
        expectedBalanceCents: 9000,
      }).success,
    ).toBe(false);

    expect(
      closeSessionFormSchema.safeParse({
        countedBalanceText: '100,00',
        notes: 'Faltou troco',
        expectedBalanceCents: 9000,
      }).success,
    ).toBe(true);
  });

  it('parses a manual sangria', () => {
    const parsed = manualMovementSchema.safeParse({
      kind: 'withdrawal',
      amountText: '50,00',
      description: 'Banco',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(resolveManualKind(parsed.data.kind)).toEqual({
        type: 'out',
        source: 'withdrawal',
      });
    }
  });
});
