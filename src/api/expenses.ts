import { apiRequest, apiRequestPaged } from '@/api/client';
import type {
  ExpenseCategory,
  ExpenseDto,
  ExpenseKind,
  PagedResult,
  PaymentMethod,
} from '@/api/types';

export type CreateExpenseInput = {
  description: string;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amountCents: number;
  dueDate?: string | null;
  recurring?: boolean;
  /** Present means "already paid" — takes the same path as `/pay`. */
  paymentMethod?: PaymentMethod;
  paidAt?: string;
};

/** `paymentMethod` is absent on purpose: paying moves money and goes through `/pay`. */
export type UpdateExpenseInput = {
  description?: string;
  category?: ExpenseCategory;
  kind?: ExpenseKind;
  amountCents?: number;
  dueDate?: string | null;
  recurring?: boolean;
};

export type PayExpenseInput = {
  paymentMethod: PaymentMethod;
  paidAt?: string;
};

export type ListExpensesQuery = {
  category?: ExpenseCategory;
  kind?: ExpenseKind;
  paid?: boolean;
  overdue?: boolean;
  /** Bounds on `paidAt`, matching `GET /payments`. */
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export function createExpense(body: CreateExpenseInput): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>('/expenses', {
    method: 'POST',
    body: {
      description: body.description,
      category: body.category,
      kind: body.kind,
      amountCents: body.amountCents,
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
      ...(body.recurring !== undefined ? { recurring: body.recurring } : {}),
      ...(body.paymentMethod ? { paymentMethod: body.paymentMethod } : {}),
      ...(body.paidAt ? { paidAt: body.paidAt } : {}),
    },
  });
}

export function listExpenses(query: ListExpensesQuery = {}): Promise<PagedResult<ExpenseDto>> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.kind) params.set('kind', query.kind);
  if (query.paid !== undefined) params.set('paid', String(query.paid));
  if (query.overdue !== undefined) params.set('overdue', String(query.overdue));
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const qs = params.toString();
  return apiRequestPaged<ExpenseDto>(`/expenses${qs ? `?${qs}` : ''}`);
}

export function getExpense(id: string): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>(`/expenses/${id}`);
}

export function updateExpense(id: string, body: UpdateExpenseInput): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>(`/expenses/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

export function payExpense(id: string, body: PayExpenseInput): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>(`/expenses/${id}/pay`, {
    method: 'POST',
    body: {
      paymentMethod: body.paymentMethod,
      ...(body.paidAt ? { paidAt: body.paidAt } : {}),
    },
  });
}

/** ADMIN, pending expenses only. */
export function deleteExpense(id: string): Promise<void> {
  return apiRequest<void>(`/expenses/${id}`, { method: 'DELETE' });
}
