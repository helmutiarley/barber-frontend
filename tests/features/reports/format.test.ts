import { describe, expect, it } from 'vitest';
import {
  bucketLabel,
  formatMinutes,
  formatMoneyOrDash,
  formatRateOrDash,
  shareOf,
} from '@/features/reports/format';

describe('rates and money that may be absent', () => {
  it('shows a dash, not a zero, when there was nothing to rate', () => {
    expect(formatRateOrDash(null)).toBe('—');
    expect(formatMoneyOrDash(null)).toBe('—');
  });

  it('still shows a real zero as zero', () => {
    expect(formatRateOrDash(0)).toBe('0%');
    expect(formatMoneyOrDash(0)).toBe('R$\u00a00,00');
  });

  it('reads a fraction as a percentage', () => {
    expect(formatRateOrDash(0.4)).toBe('40%');
    expect(formatRateOrDash(0.6875)).toBe('68,75%');
  });
});

describe('minutes', () => {
  it('reads a working day in hours', () => {
    expect(formatMinutes(510)).toBe('8h 30min');
  });

  it('drops the minutes when there are none', () => {
    expect(formatMinutes(480)).toBe('8h');
  });

  it('keeps a short stretch in minutes', () => {
    expect(formatMinutes(45)).toBe('45min');
  });

  it('reads nothing as zero minutes', () => {
    expect(formatMinutes(0)).toBe('0min');
  });
});

describe('bucket labels', () => {
  it('reads a day bucket as a date', () => {
    expect(bucketLabel({ key: '2026-08-07', label: null }, 'day')).toBe('07/08/2026');
  });

  it('says which week a week bucket starts', () => {
    expect(bucketLabel({ key: '2026-08-03', label: null }, 'week')).toBe('Semana de 03/08/2026');
  });

  it('names the month', () => {
    expect(bucketLabel({ key: '2026-08-01', label: null }, 'month')).toBe('Agosto 2026');
  });

  it('translates a payment method', () => {
    expect(bucketLabel({ key: 'pix', label: null }, 'method')).toBe('Pix');
  });

  it('prefers the display name a barber bucket carries', () => {
    expect(bucketLabel({ key: 'b-1', label: 'João' }, 'barber')).toBe('João');
  });

  it('names unattributable revenue instead of hiding it', () => {
    expect(bucketLabel({ key: null, label: null }, 'barber')).toBe('Venda da casa');
    expect(bucketLabel({ key: null, label: null }, 'service')).toBe('Sem serviço (produtos)');
  });
});

describe('share of a whole', () => {
  it('divides', () => {
    expect(shareOf(25, 100)).toBe(0.25);
  });

  it('does not divide by zero', () => {
    expect(shareOf(10, 0)).toBe(0);
  });
});
