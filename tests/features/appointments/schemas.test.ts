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

  it('requires clientId for reception', () => {
    expect(receptionBookSchema.safeParse(base).success).toBe(false);
    expect(
      receptionBookSchema.safeParse({
        ...base,
        clientId: '33333333-3333-3333-3333-333333333333',
      }).success,
    ).toBe(true);
  });

  it('requires cancel reason for staff', () => {
    expect(cancelSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(cancelSchema.safeParse({ reason: 'Cliente pediu' }).success).toBe(true);
  });
});
