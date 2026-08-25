import { apiRequest, apiRequestPaged } from '@/api/client';
import type { PagedResult, PaymentDto, PaymentMethod } from '@/api/types';

export type PaymentItemInput = {
  amountCents: number;
  method: PaymentMethod;
  /** ISO instant — same shop-day backdate only. */
  paidAt?: string;
};

export type ListPaymentsQuery = {
  method?: PaymentMethod;
  from?: string;
  to?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
};

export function recordPayments(
  appointmentId: string,
  payments: PaymentItemInput[],
): Promise<PaymentDto[]> {
  return apiRequest<PaymentDto[]>(`/appointments/${appointmentId}/payments`, {
    method: 'POST',
    body: {
      payments: payments.map((item) => ({
        amountCents: item.amountCents,
        method: item.method,
        ...(item.paidAt ? { paidAt: item.paidAt } : {}),
      })),
    },
  });
}

export function listAppointmentPayments(appointmentId: string): Promise<PaymentDto[]> {
  return apiRequest<PaymentDto[]>(`/appointments/${appointmentId}/payments`);
}

export function listPayments(query: ListPaymentsQuery = {}): Promise<PagedResult<PaymentDto>> {
  const params = new URLSearchParams();
  if (query.method) params.set('method', query.method);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.sessionId) params.set('sessionId', query.sessionId);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<PaymentDto>(`/payments${qs ? `?${qs}` : ''}`);
}

export function voidPayment(id: string, reason?: string): Promise<PaymentDto> {
  return apiRequest<PaymentDto>(`/payments/${id}`, {
    method: 'DELETE',
    body: reason ? { reason } : {},
  });
}

/** Active (non-voided) gross paid toward an appointment. */
export function activePaidCents(payments: PaymentDto[]): number {
  return payments
    .filter((payment) => payment.voidedAt === null)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
}
