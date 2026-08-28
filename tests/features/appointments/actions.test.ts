import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  availableActions,
  cancellationWindowHours,
  isInsideCancellationWindow,
  isStartsAtPast,
} from '@/features/appointments/actions';
import type { AppointmentDto } from '@/api/types';

function appointment(overrides: Partial<AppointmentDto> = {}): AppointmentDto {
  return {
    id: 'a1',
    clientId: 'c1',
    barberId: 'b1',
    serviceId: 's1',
    status: 'scheduled',
    isPaid: false,
    startsAt: '2030-06-01T15:00:00.000Z',
    endsAt: '2030-06-01T15:30:00.000Z',
    priceCents: 4500,
    durationMinutes: 30,
    notes: null,
    cancelledReason: null,
    cancelledBy: null,
    createdAt: '2030-05-01T12:00:00.000Z',
    updatedAt: '2030-05-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('appointment actions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads cancellation window from env', () => {
    vi.stubEnv('VITE_CANCELLATION_WINDOW_HOURS', '12');
    expect(cancellationWindowHours()).toBe(12);
  });

  it('detects inside cancellation window', () => {
    vi.stubEnv('VITE_CANCELLATION_WINDOW_HOURS', '24');
    const now = new Date('2030-06-01T10:00:00.000Z');
    expect(isInsideCancellationWindow('2030-06-01T15:00:00.000Z', now)).toBe(true);
    expect(isInsideCancellationWindow('2030-06-03T15:00:00.000Z', now)).toBe(false);
  });

  it('allows staff confirm/complete and blocks barber cancel', () => {
    const scheduled = appointment({ status: 'scheduled' });
    expect(availableActions(scheduled, 'MANAGER')).toEqual(
      expect.arrayContaining(['confirm', 'cancel', 'reschedule']),
    );
    expect(availableActions(scheduled, 'BARBER', { ownBarberId: 'b1' })).toEqual(['confirm']);
    expect(availableActions(scheduled, 'BARBER', { ownBarberId: 'other' })).toEqual([]);
  });

  it('allows no-show only after startsAt', () => {
    const confirmed = appointment({
      status: 'confirmed',
      startsAt: '2030-06-01T12:00:00.000Z',
    });
    const before = new Date('2030-06-01T11:00:00.000Z');
    const after = new Date('2030-06-01T13:00:00.000Z');
    expect(isStartsAtPast(confirmed.startsAt, before)).toBe(false);
    expect(availableActions(confirmed, 'ADMIN', { now: before })).not.toContain('no_show');
    expect(availableActions(confirmed, 'ADMIN', { now: after })).toEqual(
      expect.arrayContaining(['complete', 'no_show', 'cancel']),
    );
  });

  it('blocks client cancel inside the window', () => {
    vi.stubEnv('VITE_CANCELLATION_WINDOW_HOURS', '24');
    const row = appointment({ startsAt: '2030-06-01T15:00:00.000Z' });
    const now = new Date('2030-06-01T10:00:00.000Z');
    expect(availableActions(row, 'CLIENT', { now })).toEqual([]);
  });
});
