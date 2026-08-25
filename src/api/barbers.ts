import { apiRequest } from '@/api/client';
import type {
  AvailabilityDto,
  BarberDto,
  BlockDto,
  PublicBarberDto,
  ScheduleDayDto,
} from '@/api/types';

export type CreateBarberInput = {
  userId: string;
  displayName: string;
  photoUrl?: string | null;
  specialties?: string[];
};

export type UpdateBarberInput = {
  displayName?: string;
  photoUrl?: string | null;
  specialties?: string[];
};

export type ScheduleDayInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
};

export type CreateBlockInput = {
  startsAt: string;
  endsAt: string;
  reason?: string | null;
};

export type AvailabilityQuery = {
  date: string;
  serviceId?: string;
  slotMinutes?: number;
};

/** Active barbers only — public booking shape. */
export function listBarbers(): Promise<PublicBarberDto[]> {
  return apiRequest<PublicBarberDto[]>('/barbers', { skipAuth: true });
}

export function getBarber(id: string): Promise<PublicBarberDto> {
  return apiRequest<PublicBarberDto>(`/barbers/${id}`, { skipAuth: true });
}

export function createBarber(body: CreateBarberInput): Promise<BarberDto> {
  return apiRequest<BarberDto>('/barbers', {
    method: 'POST',
    body: {
      userId: body.userId,
      displayName: body.displayName,
      ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl } : {}),
      ...(body.specialties ? { specialties: body.specialties } : {}),
    },
  });
}

export function updateBarber(id: string, body: UpdateBarberInput): Promise<BarberDto> {
  return apiRequest<BarberDto>(`/barbers/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

/** Soft-deactivates (`active = false`). CONFLICT when upcoming appointments exist. */
export function deactivateBarber(id: string): Promise<BarberDto> {
  return apiRequest<BarberDto>(`/barbers/${id}`, { method: 'DELETE' });
}

export function getSchedule(id: string): Promise<ScheduleDayDto[]> {
  return apiRequest<ScheduleDayDto[]>(`/barbers/${id}/schedule`);
}

/** Full-week replace. Omitted weekdays are closed. */
export function replaceSchedule(id: string, days: ScheduleDayInput[]): Promise<ScheduleDayDto[]> {
  return apiRequest<ScheduleDayDto[]>(`/barbers/${id}/schedule`, {
    method: 'PUT',
    body: { days },
  });
}

export function createBlock(id: string, body: CreateBlockInput): Promise<BlockDto> {
  return apiRequest<BlockDto>(`/barbers/${id}/blocks`, {
    method: 'POST',
    body: {
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      ...(body.reason !== undefined ? { reason: body.reason } : {}),
    },
  });
}

export function deleteBlock(id: string, blockId: string): Promise<void> {
  return apiRequest<void>(`/barbers/${id}/blocks/${blockId}`, { method: 'DELETE' });
}

export function getAvailability(id: string, query: AvailabilityQuery): Promise<AvailabilityDto> {
  const params = new URLSearchParams({ date: query.date });
  if (query.serviceId) params.set('serviceId', query.serviceId);
  if (query.slotMinutes !== undefined) params.set('slotMinutes', String(query.slotMinutes));
  return apiRequest<AvailabilityDto>(`/barbers/${id}/availability?${params}`, { skipAuth: true });
}
