import { describe, expect, it } from 'vitest';
import {
  bookAppointmentSchema,
  cancelSchema,
  receptionBookSchema,
} from '@/features/appointments/schemas';

describe('appointment schemas', () => {
  const base = {
    barberId: '11111111-1111-1111-1111-111111111111',
    serviceId: '22222222-2222-2222-2222-222222222222',
    date: '2030-06-01',
    startsAt: '2030-06-01T12:00:00.000Z',
    notes: '',
  };

  it('accepts a client book payload', () => {
    expect(bookAppointmentSchema.safeParse(base).success).toBe(true);
  });

  const reception = { ...base, clientMode: 'existing', walkInName: '', walkInPhone: '' };

  it('requires clientId for reception', () => {
    expect(receptionBookSchema.safeParse(reception).success).toBe(false);
    expect(
      receptionBookSchema.safeParse({
        ...reception,
        clientId: '33333333-3333-3333-3333-333333333333',
      }).success,
    ).toBe(true);
  });

  describe('walk-in', () => {
    const walkIn = { ...reception, clientMode: 'walkIn' };

    it('takes a name and a phone instead of a client', () => {
      expect(
        receptionBookSchema.safeParse({
          ...walkIn,
          walkInName: 'Cliente Balcão',
          walkInPhone: '(11) 98888-7777',
        }).success,
      ).toBe(true);
    });

    it('rejects a phone with too few digits', () => {
      const result = receptionBookSchema.safeParse({
        ...walkIn,
        walkInName: 'Cliente Balcão',
        walkInPhone: '(11) 9',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['walkInPhone']);
    });

    it('rejects a missing name', () => {
      const result = receptionBookSchema.safeParse({
        ...walkIn,
        walkInName: '   ',
        walkInPhone: '11988887777',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['walkInName']);
    });
  });

  it('requires cancel reason for staff', () => {
    expect(cancelSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(cancelSchema.safeParse({ reason: 'Cliente pediu' }).success).toBe(true);
  });
});
