import type { ExpenseCategory, ExpenseKind } from '@/api/types';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Aluguel',
  utilities: 'Contas',
  supplies: 'Insumos',
  products: 'Produtos',
  salaries: 'Salários',
  maintenance: 'Manutenção',
  other: 'Outros',
};

export const EXPENSE_KIND_LABELS: Record<ExpenseKind, string> = {
  fixed: 'Fixa',
  variable: 'Variável',
};

export const EXPENSE_CATEGORY_FORM_OPTIONS: { label: string; value: ExpenseCategory }[] = (
  Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]
).map((value) => ({ label: EXPENSE_CATEGORY_LABELS[value], value }));

export const EXPENSE_CATEGORY_FILTER_OPTIONS: { label: string; value: ExpenseCategory | '' }[] = [
  { label: 'Todas', value: '' },
  ...EXPENSE_CATEGORY_FORM_OPTIONS,
];

export const EXPENSE_KIND_FORM_OPTIONS: { label: string; value: ExpenseKind }[] = [
  { label: EXPENSE_KIND_LABELS.fixed, value: 'fixed' },
  { label: EXPENSE_KIND_LABELS.variable, value: 'variable' },
];

export const EXPENSE_KIND_FILTER_OPTIONS: { label: string; value: ExpenseKind | '' }[] = [
  { label: 'Todos', value: '' },
  ...EXPENSE_KIND_FORM_OPTIONS,
];

/** `paid` and `overdue` are separate API flags; the UI offers one picker. */
export const EXPENSE_STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Todas', value: '' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Pagas', value: 'paid' },
  { label: 'Vencidas', value: 'overdue' },
];

export function statusFilterToQuery(value: string): { paid?: boolean; overdue?: boolean } {
  if (value === 'paid') return { paid: true };
  if (value === 'pending') return { paid: false };
  if (value === 'overdue') return { overdue: true };
  return {};
}
