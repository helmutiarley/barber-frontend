import { describe, expect, it } from 'vitest';
import {
  centsToMoneyInput,
  createServiceSchema,
  updateServiceSchema,
} from '@/features/services/schemas';

describe('services schemas', () => {
  it('parses a valid create payload into cents', () => {
    const parsed = createServiceSchema.safeParse({
      name: 'Corte',
      description: 'Corte masculino',
      priceText: '45,00',
      durationMinutes: '30',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.priceText).toBe(4500);
      expect(parsed.data.durationMinutes).toBe(30);
    }
  });

  it('rejects zero or negative prices', () => {
    expect(
      createServiceSchema.safeParse({
        name: 'Corte',
        description: '',
        priceText: '0',
        durationMinutes: 30,
      }).success,
    ).toBe(false);
  });

  it('rejects duration over 600 minutes', () => {
    expect(
      updateServiceSchema.safeParse({
        name: 'Maratona',
        description: '',
        priceText: '100,00',
        durationMinutes: 601,
      }).success,
    ).toBe(false);
  });

  it('formats cents for the money input', () => {
    expect(centsToMoneyInput(4500)).toBe('45,00');
    expect(centsToMoneyInput(1500)).toBe('15,00');
  });
});
