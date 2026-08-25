import { describe, expect, it } from 'vitest';
import { emptyToNull, updateClientSchema, updateOwnClientSchema } from '@/features/clients/schemas';
import { isBarberClient, isSelfClient, isStaffClient } from '@/api/clients';
import type { BarberClientDto, SelfClientDto, StaffClientDto } from '@/api/types';

describe('client schemas', () => {
  it('accepts empty birthday as clear', () => {
    const parsed = updateClientSchema.safeParse({
      birthday: '',
      preferences: 'fade',
      internalNotes: '',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects malformed birthday', () => {
    expect(
      updateOwnClientSchema.safeParse({ birthday: '01/02/1990', preferences: '' }).success,
    ).toBe(false);
  });

  it('emptyToNull maps blanks', () => {
    expect(emptyToNull('  ')).toBeNull();
    expect(emptyToNull('máquina 2')).toBe('máquina 2');
  });
});

describe('client DTO guards', () => {
  const stats = {
    visits: 2,
    lastVisitAt: null,
    averageTicketCents: 4500,
    noShows: 0,
  };

  const staff: StaffClientDto = {
    id: '1',
    name: 'Ana',
    email: 'ana@test.com',
    phone: null,
    active: true,
    birthday: null,
    preferences: null,
    internalNotes: 'vip',
    stats,
  };

  const barber: BarberClientDto = {
    id: '1',
    name: 'Ana',
    birthday: null,
    preferences: 'fade',
    stats,
  };

  const self: SelfClientDto = {
    id: '1',
    name: 'Ana',
    email: 'ana@test.com',
    phone: null,
    birthday: null,
    preferences: null,
  };

  it('discriminates the three shapes', () => {
    expect(isStaffClient(staff)).toBe(true);
    expect(isBarberClient(barber)).toBe(true);
    expect(isSelfClient(self)).toBe(true);
    expect(isStaffClient(barber)).toBe(false);
    expect(isBarberClient(staff)).toBe(false);
    expect(isSelfClient(staff)).toBe(false);
  });
});
