import type { PaymentMethod } from '@/api/types';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
};

export const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod | '' }[] = [
  { label: 'Todos', value: '' },
  { label: PAYMENT_METHOD_LABELS.cash, value: 'cash' },
  { label: PAYMENT_METHOD_LABELS.pix, value: 'pix' },
  { label: PAYMENT_METHOD_LABELS.debit, value: 'debit' },
  { label: PAYMENT_METHOD_LABELS.credit, value: 'credit' },
];

export const PAYMENT_METHOD_FORM_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: PAYMENT_METHOD_LABELS.cash, value: 'cash' },
  { label: PAYMENT_METHOD_LABELS.pix, value: 'pix' },
  { label: PAYMENT_METHOD_LABELS.debit, value: 'debit' },
  { label: PAYMENT_METHOD_LABELS.credit, value: 'credit' },
];
