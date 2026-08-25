import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoneyInput } from '@/lib/money';

describe('formatMoney', () => {
  it('formats integer cents as BRL', () => {
    expect(formatMoney(0)).toBe('R$\u00a00,00');
    expect(formatMoney(1250)).toBe('R$\u00a012,50');
    expect(formatMoney(123456)).toBe('R$\u00a01.234,56');
  });

  it('rejects non-integers', () => {
    expect(() => formatMoney(12.5)).toThrow(/integer cents/);
  });
});

describe('parseMoneyInput', () => {
  it('parses pt-BR and plain decimals', () => {
    expect(parseMoneyInput('12,50')).toBe(1250);
    expect(parseMoneyInput('12.50')).toBe(1250);
    expect(parseMoneyInput('R$ 1.234,56')).toBe(123456);
    expect(parseMoneyInput('10')).toBe(1000);
  });

  it('rejects empty input', () => {
    expect(() => parseMoneyInput('  ')).toThrow();
  });
});
