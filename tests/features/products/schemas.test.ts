import { describe, expect, it } from 'vitest';
import { defaultSignFor, STOCK_REASON_LABELS } from '@/features/products/labels';
import {
  adjustStockSchema,
  centsToMoneyInput,
  createProductSchema,
  sellProductsSchema,
  signedDelta,
  updateProductSchema,
  voidSaleSchema,
} from '@/features/products/schemas';

function baseCreate(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Pomada modeladora',
    description: 'Fixação forte',
    priceText: '45,00',
    costText: '20,00',
    stockQuantity: 12,
    lowStockThreshold: 3,
    ...overrides,
  };
}

function baseAdjust(overrides: Record<string, unknown> = {}) {
  return {
    reason: 'purchase',
    direction: 'in',
    quantity: 6,
    notes: '',
    stockQuantity: 4,
    ...overrides,
  };
}

function baseSale(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ productId: 'p-1', quantity: 2 }],
    method: 'cash',
    soldByBarberId: '',
    clientId: '',
    ...overrides,
  };
}

describe('product schemas', () => {
  it('parses price and cost into integer cents', () => {
    const parsed = createProductSchema.safeParse(baseCreate());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.priceText).toBe(4_500);
      expect(parsed.data.costText).toBe(2_000);
    }
  });

  it('rejects a free product', () => {
    expect(createProductSchema.safeParse(baseCreate({ priceText: '0,00' })).success).toBe(false);
  });

  it('reads an empty cost as untracked rather than zero', () => {
    const parsed = createProductSchema.safeParse(baseCreate({ costText: '' }));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.costText).toBeNull();
  });

  it('accepts an empty shelf but not a fractional count', () => {
    expect(createProductSchema.safeParse(baseCreate({ stockQuantity: 0 })).success).toBe(true);
    expect(createProductSchema.safeParse(baseCreate({ stockQuantity: 1.5 })).success).toBe(false);
  });

  it('has no stock field on the edit form', () => {
    const parsed = updateProductSchema.safeParse({
      name: 'Pomada',
      description: '',
      priceText: '39,90',
      costText: '',
      lowStockThreshold: 2,
      stockQuantity: 99,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect('stockQuantity' in parsed.data).toBe(false);
  });
});

describe('stock adjustment schema', () => {
  it('accepts a purchase of any size', () => {
    expect(adjustStockSchema.safeParse(baseAdjust()).success).toBe(true);
  });

  it('refuses to write off more than is on the shelf', () => {
    const parsed = adjustStockSchema.safeParse(
      baseAdjust({ reason: 'loss', direction: 'out', quantity: 5, stockQuantity: 4 }),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(['quantity']);
    }
  });

  it('allows emptying the shelf exactly', () => {
    expect(
      adjustStockSchema.safeParse(
        baseAdjust({ reason: 'loss', direction: 'out', quantity: 4, stockQuantity: 4 }),
      ).success,
    ).toBe(true);
  });

  it('rejects an adjustment of nothing', () => {
    expect(adjustStockSchema.safeParse(baseAdjust({ quantity: 0 })).success).toBe(false);
  });

  it('rejects a reason staff could not have picked', () => {
    expect(adjustStockSchema.safeParse(baseAdjust({ reason: 'sale' })).success).toBe(false);
  });

  it('signs the delta from the direction', () => {
    expect(signedDelta('in', 6)).toBe(6);
    expect(signedDelta('out', 6)).toBe(-6);
  });

  it('defaults a purchase to an entry and everything else to a write-off', () => {
    expect(defaultSignFor('purchase')).toBe(1);
    expect(defaultSignFor('loss')).toBe(-1);
    expect(defaultSignFor('correction')).toBe(-1);
  });

  it('labels every reason', () => {
    expect(Object.keys(STOCK_REASON_LABELS)).toEqual(['purchase', 'loss', 'correction']);
  });
});

describe('sale schema', () => {
  it('accepts a one-line basket', () => {
    expect(sellProductsSchema.safeParse(baseSale()).success).toBe(true);
  });

  it('requires at least one item', () => {
    expect(sellProductsSchema.safeParse(baseSale({ items: [] })).success).toBe(false);
  });

  it('requires a product on every line', () => {
    const parsed = sellProductsSchema.safeParse(
      baseSale({ items: [{ productId: '', quantity: 1 }] }),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(['items', 0, 'productId']);
    }
  });

  it('rejects a non-positive quantity', () => {
    expect(
      sellProductsSchema.safeParse(baseSale({ items: [{ productId: 'p-1', quantity: 0 }] }))
        .success,
    ).toBe(false);
  });

  it('leaves the seller and the client optional', () => {
    const parsed = sellProductsSchema.safeParse(baseSale());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.soldByBarberId).toBe('');
      expect(parsed.data.clientId).toBe('');
    }
  });

  it('takes one method for the whole basket', () => {
    expect(sellProductsSchema.safeParse(baseSale({ method: 'boleto' })).success).toBe(false);
  });
});

describe('void schema', () => {
  it('takes an optional reason', () => {
    expect(voidSaleSchema.safeParse({ reason: '' }).success).toBe(true);
    expect(voidSaleSchema.safeParse({ reason: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('money input', () => {
  it('formats cents for the edit form', () => {
    expect(centsToMoneyInput(4_500)).toBe('45,00');
  });
});
