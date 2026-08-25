import { apiRequest, apiRequestPaged } from '@/api/client';
import type { AppointmentDto, AppointmentStatus, PagedResult } from '@/api/types';

export type CreateAppointmentInput = {
  barberId: string;
  serviceId: string;
  startsAt: string;
  clientId?: string;
  notes?: string;
  force?: boolean;
};

export type RescheduleAppointmentInput = {
  startsAt: string;
  notes?: string | null;
  force?: boolean;
};

export type ListAppointmentsQuery = {
  from: string;
  to: string;
  barberId?: string;
  clientId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  limit?: number;
  offset?: number;
};

export type PageQuery = {
  limit?: number;
  offset?: number;
};

export function createAppointment(body: CreateAppointmentInput): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>('/appointments', {
    method: 'POST',
    body: {
      barberId: body.barberId,
      serviceId: body.serviceId,
      startsAt: body.startsAt,
      ...(body.clientId ? { clientId: body.clientId } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
      ...(body.force !== undefined ? { force: body.force } : {}),
    },
  });
}

export function listAppointments(
  query: ListAppointmentsQuery,
): Promise<PagedResult<AppointmentDto>> {
  const params = new URLSearchParams({
    from: query.from,
    to: query.to,
  });
  if (query.barberId) params.set('barberId', query.barberId);
  if (query.clientId) params.set('clientId', query.clientId);
  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status];
    for (const status of statuses) params.append('status', status);
  }
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  return apiRequestPaged<AppointmentDto>(`/appointments?${params}`);
}

export function getAppointment(id: string): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>(`/appointments/${id}`);
}

export function getBarberAgenda(barberId: string, date: string): Promise<AppointmentDto[]> {
  return apiRequest<AppointmentDto[]>(
    `/barbers/${barberId}/agenda?date=${encodeURIComponent(date)}`,
  );
}

export function listMyAppointments(query: PageQuery = {}): Promise<PagedResult<AppointmentDto>> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<AppointmentDto>(`/clients/me/appointments${qs ? `?${qs}` : ''}`);
}

export function rescheduleAppointment(
  id: string,
  body: RescheduleAppointmentInput,
): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>(`/appointments/${id}`, {
    method: 'PATCH',
    body: {
      startsAt: body.startsAt,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.force !== undefined ? { force: body.force } : {}),
    },
  });
}

export function confirmAppointment(id: string): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>(`/appointments/${id}/confirm`, { method: 'POST' });
}

export function completeAppointment(id: string): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>(`/appointments/${id}/complete`, { method: 'POST' });
}

export function cancelAppointment(id: string, reason?: string): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>(`/appointments/${id}/cancel`, {
    method: 'POST',
    body: reason ? { reason } : {},
  });
}

export function markNoShow(id: string): Promise<AppointmentDto> {
  return apiRequest<AppointmentDto>(`/appointments/${id}/no-show`, { method: 'POST' });
}
