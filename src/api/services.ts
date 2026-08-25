import { apiRequest } from '@/api/client';
import type { ServiceDto } from '@/api/types';

export type ListServicesQuery = {
  includeInactive?: boolean;
};

export type CreateServiceInput = {
  name: string;
  description?: string | null;
  priceCents: number;
  durationMinutes: number;
};

export type UpdateServiceInput = {
  name?: string;
  description?: string | null;
  priceCents?: number;
  durationMinutes?: number;
};

export function listServices(query: ListServicesQuery = {}): Promise<ServiceDto[]> {
  const params = new URLSearchParams();
  if (query.includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  // Staff lists need the auth header when asking for inactive rows.
  return apiRequest<ServiceDto[]>(`/services${qs ? `?${qs}` : ''}`, {
    skipAuth: !query.includeInactive,
  });
}

export function getService(id: string): Promise<ServiceDto> {
  return apiRequest<ServiceDto>(`/services/${id}`, { skipAuth: true });
}

export function createService(body: CreateServiceInput): Promise<ServiceDto> {
  return apiRequest<ServiceDto>('/services', {
    method: 'POST',
    body: {
      name: body.name,
      priceCents: body.priceCents,
      durationMinutes: body.durationMinutes,
      ...(body.description !== undefined ? { description: body.description } : {}),
    },
  });
}

export function updateService(id: string, body: UpdateServiceInput): Promise<ServiceDto> {
  return apiRequest<ServiceDto>(`/services/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

/** Soft-deactivates (`active = false`). Idempotent. */
export function deactivateService(id: string): Promise<ServiceDto> {
  return apiRequest<ServiceDto>(`/services/${id}`, { method: 'DELETE' });
}
