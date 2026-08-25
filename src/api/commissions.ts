import { apiRequest, apiRequestPaged } from '@/api/client';
import type {
  CommissionAdvanceDto,
  CommissionAppliesTo,
  CommissionBase,
  CommissionEntryDto,
  CommissionPeriodDto,
  CommissionPeriodStatus,
  CommissionRuleDto,
  CommissionStatementDto,
  PagedResult,
  PaymentMethod,
} from '@/api/types';

export type CreateCommissionRuleInput = {
  /** Omitted or null is the wildcard. */
  barberId?: string | null;
  serviceId?: string | null;
  rate: number;
  base: CommissionBase;
  appliesTo?: CommissionAppliesTo;
};

/** The scope is immutable on purpose: retire a rule, don't move it. */
export type UpdateCommissionRuleInput = {
  rate?: number;
  base?: CommissionBase;
  active?: boolean;
};

export type ListCommissionRulesQuery = {
  appliesTo?: CommissionAppliesTo;
  active?: boolean;
};

export type ListCommissionEntriesQuery = {
  barberId?: string;
  periodId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type RecordCommissionAdvanceInput = {
  barberId: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
};

export type ListCommissionAdvancesQuery = {
  barberId?: string;
  unassigned?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type CloseCommissionPeriodInput = {
  /** Omitted closes every barber who has something to settle. */
  barberId?: string;
  startsOn: string;
  endsOn: string;
};

export type ListCommissionPeriodsQuery = {
  barberId?: string;
  status?: CommissionPeriodStatus;
  /** Calendar bounds: periods whose inclusive range intersects them. */
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export function listCommissionRules(
  query: ListCommissionRulesQuery = {},
): Promise<CommissionRuleDto[]> {
  const params = new URLSearchParams();
  if (query.appliesTo) params.set('appliesTo', query.appliesTo);
  if (query.active !== undefined) params.set('active', String(query.active));
  const qs = params.toString();
  return apiRequest<CommissionRuleDto[]>(`/commission-rules${qs ? `?${qs}` : ''}`);
}

export function createCommissionRule(
  body: CreateCommissionRuleInput,
): Promise<CommissionRuleDto> {
  return apiRequest<CommissionRuleDto>('/commission-rules', {
    method: 'POST',
    body: {
      rate: body.rate,
      base: body.base,
      ...(body.barberId !== undefined ? { barberId: body.barberId } : {}),
      ...(body.serviceId !== undefined ? { serviceId: body.serviceId } : {}),
      ...(body.appliesTo ? { appliesTo: body.appliesTo } : {}),
    },
  });
}

export function updateCommissionRule(
  id: string,
  body: UpdateCommissionRuleInput,
): Promise<CommissionRuleDto> {
  return apiRequest<CommissionRuleDto>(`/commission-rules/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

export function listCommissionEntries(
  query: ListCommissionEntriesQuery = {},
): Promise<PagedResult<CommissionEntryDto>> {
  const params = new URLSearchParams();
  if (query.barberId) params.set('barberId', query.barberId);
  if (query.periodId) params.set('periodId', query.periodId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<CommissionEntryDto>(`/commissions/entries${qs ? `?${qs}` : ''}`);
}

export function recordCommissionAdvance(
  body: RecordCommissionAdvanceInput,
): Promise<CommissionAdvanceDto> {
  return apiRequest<CommissionAdvanceDto>('/commission-advances', {
    method: 'POST',
    body: {
      barberId: body.barberId,
      amountCents: body.amountCents,
      paymentMethod: body.paymentMethod,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });
}

export function listCommissionAdvances(
  query: ListCommissionAdvancesQuery = {},
): Promise<PagedResult<CommissionAdvanceDto>> {
  const params = new URLSearchParams();
  if (query.barberId) params.set('barberId', query.barberId);
  if (query.unassigned !== undefined) params.set('unassigned', String(query.unassigned));
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<CommissionAdvanceDto>(`/commission-advances${qs ? `?${qs}` : ''}`);
}

/** Returns every period it closed — empty when nobody had anything owing. */
export function closeCommissionPeriod(
  body: CloseCommissionPeriodInput,
): Promise<CommissionPeriodDto[]> {
  return apiRequest<CommissionPeriodDto[]>('/commission-periods/close', {
    method: 'POST',
    body: {
      startsOn: body.startsOn,
      endsOn: body.endsOn,
      ...(body.barberId ? { barberId: body.barberId } : {}),
    },
  });
}

export function listCommissionPeriods(
  query: ListCommissionPeriodsQuery = {},
): Promise<PagedResult<CommissionPeriodDto>> {
  const params = new URLSearchParams();
  if (query.barberId) params.set('barberId', query.barberId);
  if (query.status) params.set('status', query.status);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<CommissionPeriodDto>(`/commission-periods${qs ? `?${qs}` : ''}`);
}

export function getCommissionStatement(id: string): Promise<CommissionStatementDto> {
  return apiRequest<CommissionStatementDto>(`/commission-periods/${id}`);
}

export function payCommissionPeriod(
  id: string,
  paymentMethod: PaymentMethod,
): Promise<CommissionPeriodDto> {
  return apiRequest<CommissionPeriodDto>(`/commission-periods/${id}/pay`, {
    method: 'POST',
    body: { paymentMethod },
  });
}
