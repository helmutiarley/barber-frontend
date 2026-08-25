import type { AppointmentDto } from '@/api/types';
import type { UserRole } from '@/lib/roles';
import { DateTime } from 'luxon';

export type AppointmentAction = 'confirm' | 'complete' | 'cancel' | 'no_show' | 'reschedule';

export function cancellationWindowHours(): number {
  const raw = import.meta.env.VITE_CANCELLATION_WINDOW_HOURS;
  const parsed = raw !== undefined && raw !== '' ? Number(raw) : 24;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 24;
}

/** True when a CLIENT is too close to `startsAt` to cancel/reschedule alone. */
export function isInsideCancellationWindow(startsAt: string, now: Date = new Date()): boolean {
  const start = DateTime.fromISO(startsAt, { zone: 'utc' });
  if (!start.isValid) {
    return true;
  }

  const hoursUntil = start.diff(DateTime.fromJSDate(now, { zone: 'utc' }), 'hours').hours;
  return hoursUntil < cancellationWindowHours();
}

export function isStartsAtPast(startsAt: string, now: Date = new Date()): boolean {
  const start = DateTime.fromISO(startsAt, { zone: 'utc' });
  if (!start.isValid) {
    return false;
  }

  return start.toMillis() <= now.getTime();
}

function isOwnChair(
  appointment: AppointmentDto,
  role: UserRole,
  ownBarberId: string | null | undefined,
): boolean {
  if (role === 'ADMIN' || role === 'MANAGER') {
    return true;
  }

  return role === 'BARBER' && Boolean(ownBarberId) && appointment.barberId === ownBarberId;
}

/**
 * Legal UI actions for status + role. Ownership (clientId) is the caller's job
 * for CLIENT; barbers never get cancel/reschedule.
 */
export function availableActions(
  appointment: AppointmentDto,
  role: UserRole,
  options: { ownBarberId?: string | null; now?: Date } = {},
): AppointmentAction[] {
  const now = options.now ?? new Date();
  const actions: AppointmentAction[] = [];
  const chair = isOwnChair(appointment, role, options.ownBarberId);
  const status = appointment.status;

  if ((status === 'scheduled' || status === 'confirmed') && (role === 'ADMIN' || role === 'MANAGER')) {
    actions.push('reschedule', 'cancel');
  }

  if (status === 'scheduled' || status === 'confirmed') {
    if (role === 'CLIENT' && !isInsideCancellationWindow(appointment.startsAt, now)) {
      actions.push('reschedule', 'cancel');
    }
  }

  if (status === 'scheduled' && chair && role !== 'CLIENT') {
    actions.push('confirm');
  }

  if (status === 'confirmed' && chair && role !== 'CLIENT') {
    actions.push('complete');
    if (isStartsAtPast(appointment.startsAt, now)) {
      actions.push('no_show');
    }
  }

  return actions;
}
