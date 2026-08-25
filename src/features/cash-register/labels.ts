import type { CashMovementSource, CashMovementType, ManualCashMovementSource } from '@/api/types';

export const MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  in: 'Entrada',
  out: 'Saída',
};

export const MOVEMENT_SOURCE_LABELS: Record<CashMovementSource, string> = {
  payment: 'Pagamento',
  expense: 'Despesa',
  withdrawal: 'Sangria',
  deposit: 'Suprimento',
  advance: 'Vale',
  payout: 'Comissão',
  adjustment: 'Ajuste',
};

/** UI presets — maps to API `type` + `source`. */
export type ManualMovementKind = 'deposit' | 'withdrawal' | 'adjustment_in' | 'adjustment_out';

export const MANUAL_MOVEMENT_OPTIONS: {
  label: string;
  value: ManualMovementKind;
  type: CashMovementType;
  source: ManualCashMovementSource;
}[] = [
  { label: 'Suprimento (entrada)', value: 'deposit', type: 'in', source: 'deposit' },
  { label: 'Sangria (saída)', value: 'withdrawal', type: 'out', source: 'withdrawal' },
  { label: 'Ajuste — entrada', value: 'adjustment_in', type: 'in', source: 'adjustment' },
  { label: 'Ajuste — saída', value: 'adjustment_out', type: 'out', source: 'adjustment' },
];

export function resolveManualKind(kind: ManualMovementKind): {
  type: CashMovementType;
  source: ManualCashMovementSource;
} {
  const match = MANUAL_MOVEMENT_OPTIONS.find((option) => option.value === kind);
  if (!match) {
    throw new Error(`Unknown manual movement kind: ${kind}`);
  }

  return { type: match.type, source: match.source };
}
