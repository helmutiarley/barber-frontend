import { describe, expect, it } from 'vitest';
import { statusFilterToQuery } from '@/features/expenses/labels';
import {
  centsToMoneyInput,
  createExpenseSchema,
  payExpenseSchema,
  updateExpenseSchema,
  updatePaidExpenseSchema,
} from '@/features/expenses/schemas';

function baseCreate(overrides: Record<string, unknown> = {}) {
  return {
    description: 'Aluguel de agosto',
    category: 'rent',
    kind: 'fixed',
    amountText: '1.500,00',
    dueDate: '2026-08-10',
    recurring: true,
    payNow: false,
    paymentMethod: 'pix',
    ...overrides,
  };
}

describe('expenses schemas', () => {
  it('parses money into integer cents', () => {
    const parsed = createExpenseSchema.safeParse(baseCreate());
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.amountText).toBe(150_000);
  });

  it('rejects a non-positive amount', () => {
    expect(createExpenseSchema.safeParse(baseCreate({ amountText: '0,00' })).success).toBe(false);
  });

  it('accepts an empty due date but rejects a malformed one', () => {
    expect(createExpenseSchema.safeParse(baseCreate({ dueDate: '' })).success).toBe(true);
    expect(createExpenseSchema.safeParse(baseCreate({ dueDate: '10/08/2026' })).success).toBe(
      false,
    );
  });

  it('requires a payment method only when paying now', () => {
    expect(
      createExpenseSchema.safeParse(baseCreate({ payNow: false, paymentMethod: '' })).success,
    ).toBe(true);

    const paying = createExpenseSchema.safeParse(
      baseCreate({ payNow: true, paymentMethod: '' }),
    );
    expect(paying.success).toBe(false);
    if (!paying.success) {
      expect(paying.error.issues[0]?.path).toEqual(['paymentMethod']);
    }
  });

  it('keeps a paid expense to description and category', () => {
    const parsed = updatePaidExpenseSchema.safeParse({
      description: 'Aluguel de agosto',
      category: 'rent',
      amountText: '99,00',
      kind: 'variable',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ description: 'Aluguel de agosto', category: 'rent' });
    }
  });

  it('edits every field while pending', () => {
    const parsed = updateExpenseSchema.safeParse({
      description: 'Luz',
      category: 'utilities',
      kind: 'variable',
      amountText: '210,50',
      dueDate: '',
      recurring: false,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.amountText).toBe(21_050);
  });

  it('rejects an unknown category', () => {
    expect(createExpenseSchema.safeParse(baseCreate({ category: 'coffee' })).success).toBe(false);
  });

  it('requires a known method to pay', () => {
    expect(payExpenseSchema.safeParse({ paymentMethod: 'cash' }).success).toBe(true);
    expect(payExpenseSchema.safeParse({ paymentMethod: '' }).success).toBe(false);
  });

  it('formats cents for a money input', () => {
    expect(centsToMoneyInput(150_000)).toBe('1.500,00');
  });
});

describe('expenses status filter', () => {
  it('maps the single picker onto the two API flags', () => {
    expect(statusFilterToQuery('')).toEqual({});
    expect(statusFilterToQuery('paid')).toEqual({ paid: true });
    expect(statusFilterToQuery('pending')).toEqual({ paid: false });
    expect(statusFilterToQuery('overdue')).toEqual({ overdue: true });
  });
});
