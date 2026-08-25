import type { StockAdjustmentReason } from '@/api/types';

export const STOCK_REASON_LABELS: Record<StockAdjustmentReason, string> = {
  purchase: 'Compra',
  loss: 'Perda',
  correction: 'Correção',
};

export const STOCK_REASON_HINTS: Record<StockAdjustmentReason, string> = {
  purchase: 'Entrada de mercadoria.',
  loss: 'Quebra, vencimento, furto.',
  correction: 'Contagem de prateleira que não bateu.',
};

export const STOCK_REASON_FORM_OPTIONS: { label: string; value: StockAdjustmentReason }[] = [
  { label: STOCK_REASON_LABELS.purchase, value: 'purchase' },
  { label: STOCK_REASON_LABELS.loss, value: 'loss' },
  { label: STOCK_REASON_LABELS.correction, value: 'correction' },
];

export const SALE_STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Todas', value: '' },
  { label: 'Ativas', value: 'false' },
  { label: 'Estornadas', value: 'true' },
];

/** `purchase` puts units on the shelf; the other two are almost always write-offs. */
export function defaultSignFor(reason: StockAdjustmentReason): 1 | -1 {
  return reason === 'purchase' ? 1 : -1;
}
