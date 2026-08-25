import { describe, expect, it } from 'vitest';
import {
  fitsPercentScale,
  formatRate,
  parsePercentInput,
  percentToRate,
  rateToPercent,
} from '@/features/commissions/rate';

describe('commission rate conversion', () => {
  it('treats a rate as a fraction, not a percentage', () => {
    expect(percentToRate(40)).toBe(0.4);
    expect(rateToPercent(0.4)).toBe(40);
  });

  it('survives the percentages floats round badly', () => {
    // 40.1 / 100 is 0.40100000000000002, which would fail the four-decimal check.
    expect(percentToRate(40.1)).toBe(0.401);
    expect(percentToRate(33.33)).toBe(0.3333);
    expect(rateToPercent(0.3333)).toBe(33.33);
  });

  it('round-trips every two-decimal percentage', () => {
    for (const percent of [0, 5, 12.5, 33.33, 66.67, 99.99, 100]) {
      expect(rateToPercent(percentToRate(percent))).toBe(percent);
    }
  });

  it('rejects a third decimal, which the column would truncate', () => {
    expect(fitsPercentScale(40)).toBe(true);
    expect(fitsPercentScale(40.25)).toBe(true);
    expect(fitsPercentScale(40.255)).toBe(false);
  });

  it('formats a rate for display', () => {
    expect(formatRate(0.4)).toBe('40%');
    expect(formatRate(0.3333)).toBe('33,33%');
    expect(formatRate(0)).toBe('0%');
  });

  it('accepts a comma decimal separator and a stray percent sign', () => {
    expect(parsePercentInput('33,33')).toBe(33.33);
    expect(parsePercentInput(' 40% ')).toBe(40);
    expect(() => parsePercentInput('abc')).toThrow();
    expect(() => parsePercentInput('')).toThrow();
  });
});
