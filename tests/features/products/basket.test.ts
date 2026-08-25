import { describe, expect, it } from 'vitest';
import { basketProblems, basketTotalCents, lineQuantity } from '@/features/products/basket';

const SHELF = [
  { id: 'p-1', name: 'Pomada', stockQuantity: 4, priceCents: 4_500 },
  { id: 'p-2', name: 'Shampoo', stockQuantity: 0, priceCents: 3_000 },
];

describe('basket quantity', () => {
  it('reads a typed number', () => {
    expect(lineQuantity({ productId: 'p-1', quantity: '3' })).toBe(3);
  });

  it('treats a blank or negative entry as nothing', () => {
    expect(lineQuantity({ productId: 'p-1', quantity: '' })).toBe(0);
    expect(lineQuantity({ productId: 'p-1', quantity: -2 })).toBe(0);
  });

  it('drops a fraction rather than rounding up into stock that is not there', () => {
    expect(lineQuantity({ productId: 'p-1', quantity: 2.9 })).toBe(2);
  });
});

describe('basket problems', () => {
  it('passes a basket the shelf can fill', () => {
    expect(basketProblems([{ productId: 'p-1', quantity: 4 }], SHELF)).toEqual([]);
  });

  it('names the product that is short, with both numbers', () => {
    const problems = basketProblems([{ productId: 'p-1', quantity: 5 }], SHELF);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Pomada');
    expect(problems[0]).toContain('5');
    expect(problems[0]).toContain('4');
  });

  it('catches an empty shelf', () => {
    expect(basketProblems([{ productId: 'p-2', quantity: 1 }], SHELF)).toHaveLength(1);
  });

  it('refuses the same product twice, as the API does', () => {
    const problems = basketProblems(
      [
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-1', quantity: 1 },
      ],
      SHELF,
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('duas vezes');
  });

  it('reports a repeated product once, not per line', () => {
    const problems = basketProblems(
      [
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-1', quantity: 1 },
        { productId: 'p-1', quantity: 1 },
      ],
      SHELF,
    );
    expect(problems).toHaveLength(1);
  });

  it('ignores a line with no product chosen yet', () => {
    expect(basketProblems([{ productId: '', quantity: 1 }], SHELF)).toEqual([]);
  });
});

describe('basket total', () => {
  it('multiplies the catalog price by the quantity', () => {
    expect(basketTotalCents([{ productId: 'p-1', quantity: 2 }], SHELF)).toBe(9_000);
  });

  it('adds the lines up', () => {
    expect(
      basketTotalCents(
        [
          { productId: 'p-1', quantity: 1 },
          { productId: 'p-2', quantity: 2 },
        ],
        SHELF,
      ),
    ).toBe(10_500);
  });

  it('counts an unchosen line as nothing', () => {
    expect(basketTotalCents([{ productId: '', quantity: 3 }], SHELF)).toBe(0);
  });
});
