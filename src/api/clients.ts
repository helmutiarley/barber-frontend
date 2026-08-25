import { apiRequest, apiRequestPaged } from '@/api/client';
import type {
  AppointmentDto,
  BarberClientDto,
  ClientDetailDto,
  ClientListItemDto,
  PagedResult,
  SelfClientDto,
  StaffClientDto,
} from '@/api/types';

export type ListClientsQuery = {
  search?: string;
  birthdayMonth?: number;
  /** ISO instant or date — clients with no completed visit since this point. */
  inactiveSince?: string;
  limit?: number;
  offset?: number;
};

export type UpdateClientInput = {
  birthday?: string | null;
  preferences?: string | null;
  internalNotes?: string | null;
};

export type UpdateOwnClientInput = {
  birthday?: string | null;
  preferences?: string | null;
};

export type PageQuery = {
  limit?: number;
  offset?: number;
};

export function listClients(query: ListClientsQuery = {}): Promise<PagedResult<ClientListItemDto>> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.birthdayMonth !== undefined) {
    params.set('birthdayMonth', String(query.birthdayMonth));
  }
  if (query.inactiveSince) params.set('inactiveSince', query.inactiveSince);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<ClientListItemDto>(`/clients${qs ? `?${qs}` : ''}`);
}

export function getClient(id: string): Promise<ClientDetailDto> {
  return apiRequest<ClientDetailDto>(`/clients/${id}`);
}

export function updateClient(id: string, body: UpdateClientInput): Promise<StaffClientDto> {
  return apiRequest<StaffClientDto>(`/clients/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

export function getClientHistory(
  id: string,
  query: PageQuery = {},
): Promise<PagedResult<AppointmentDto>> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<AppointmentDto>(`/clients/${id}/history${qs ? `?${qs}` : ''}`);
}

export function getMyClient(): Promise<SelfClientDto> {
  return apiRequest<SelfClientDto>('/clients/me');
}

export function updateMyClient(body: UpdateOwnClientInput): Promise<SelfClientDto> {
  return apiRequest<SelfClientDto>('/clients/me', {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

export function isStaffClient(dto: ClientDetailDto): dto is StaffClientDto {
  return 'internalNotes' in dto && 'stats' in dto;
}

export function isBarberClient(dto: ClientDetailDto): dto is BarberClientDto {
  return 'stats' in dto && !('email' in dto);
}

export function isSelfClient(dto: ClientDetailDto): dto is SelfClientDto {
  return 'email' in dto && !('stats' in dto);
}
