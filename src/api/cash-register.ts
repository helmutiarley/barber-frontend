import { apiRequest, apiRequestPaged } from '@/api/client';
import { ApiError } from '@/lib/errors';
import type {
  CashMovementDto,
  CashMovementType,
  CurrentSessionDto,
  ManualCashMovementSource,
  PagedResult,
  SessionDetailDto,
  SessionDto,
} from '@/api/types';

export type OpenSessionInput = {
  openingBalanceCents: number;
};

export type CloseSessionInput = {
  countedBalanceCents: number;
  notes?: string;
};

export type CreateMovementInput = {
  type: CashMovementType;
  source: ManualCashMovementSource;
  amountCents: number;
  description: string;
};

export type ListSessionsQuery = {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

/** `null` when the drawer is closed (API answers CONFLICT). */
export async function getCurrentSession(): Promise<CurrentSessionDto | null> {
  try {
    return await apiRequest<CurrentSessionDto>('/cash-register/current');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 409 || error.code === 'CONFLICT')) {
      return null;
    }

    throw error;
  }
}

export function openSession(body: OpenSessionInput): Promise<SessionDto> {
  return apiRequest<SessionDto>('/cash-register/open', {
    method: 'POST',
    body: { openingBalanceCents: body.openingBalanceCents },
  });
}

export function closeSession(body: CloseSessionInput): Promise<SessionDto> {
  return apiRequest<SessionDto>('/cash-register/close', {
    method: 'POST',
    body: {
      countedBalanceCents: body.countedBalanceCents,
      ...(body.notes ? { notes: body.notes } : {}),
    },
  });
}

export function createMovement(body: CreateMovementInput): Promise<CashMovementDto> {
  return apiRequest<CashMovementDto>('/cash-register/movements', {
    method: 'POST',
    body: {
      type: body.type,
      source: body.source,
      amountCents: body.amountCents,
      description: body.description,
    },
  });
}

export function listSessions(query: ListSessionsQuery = {}): Promise<PagedResult<SessionDto>> {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<SessionDto>(`/cash-register/sessions${qs ? `?${qs}` : ''}`);
}

export function getSession(id: string): Promise<SessionDetailDto> {
  return apiRequest<SessionDetailDto>(`/cash-register/sessions/${id}`);
}
