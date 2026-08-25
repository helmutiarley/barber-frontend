import type {
  CommissionAppliesTo,
  CommissionBase,
  CommissionPeriodStatus,
  CommissionRuleDto,
} from '@/api/types';

export const COMMISSION_BASE_LABELS: Record<CommissionBase, string> = {
  gross: 'Bruto',
  net: 'Líquido',
};

export const COMMISSION_BASE_HINTS: Record<CommissionBase, string> = {
  gross: 'Sobre o preço do serviço.',
  net: 'Sobre o que sobrou depois das taxas de cartão.',
};

export const COMMISSION_BASE_FORM_OPTIONS: { label: string; value: CommissionBase }[] = [
  { label: COMMISSION_BASE_LABELS.gross, value: 'gross' },
  { label: COMMISSION_BASE_LABELS.net, value: 'net' },
];

export const COMMISSION_APPLIES_TO_LABELS: Record<CommissionAppliesTo, string> = {
  services: 'Serviços',
  products: 'Produtos',
};

export const COMMISSION_APPLIES_TO_FORM_OPTIONS: {
  label: string;
  value: CommissionAppliesTo;
}[] = [
  { label: COMMISSION_APPLIES_TO_LABELS.services, value: 'services' },
  { label: COMMISSION_APPLIES_TO_LABELS.products, value: 'products' },
];

export const COMMISSION_APPLIES_TO_FILTER_OPTIONS: {
  label: string;
  value: CommissionAppliesTo | '';
}[] = [{ label: 'Tudo', value: '' }, ...COMMISSION_APPLIES_TO_FORM_OPTIONS];

export const PERIOD_STATUS_LABELS: Record<CommissionPeriodStatus, string> = {
  closed: 'Fechado',
  paid: 'Pago',
};

export const PERIOD_STATUS_COLORS: Record<CommissionPeriodStatus, string> = {
  closed: 'warning',
  paid: 'success',
};

export const PERIOD_STATUS_FILTER_OPTIONS: {
  label: string;
  value: CommissionPeriodStatus | '';
}[] = [
  { label: 'Todos', value: '' },
  { label: PERIOD_STATUS_LABELS.closed, value: 'closed' },
  { label: PERIOD_STATUS_LABELS.paid, value: 'paid' },
];

export const PRECEDENCE_HINT =
  'Precedência: (barbeiro, serviço) > (barbeiro, todos) > (todos, serviço) > (todos, todos). Uma regra vence; sem nenhuma, concluir o horário é bloqueado.';

/**
 * How specific a rule is, mirroring the server's precedence score. Sorting by it
 * puts the rule that would actually win at the top of the list.
 */
export function specificity(rule: Pick<CommissionRuleDto, 'barberId' | 'serviceId'>): number {
  return (rule.barberId ? 2 : 0) + (rule.serviceId ? 1 : 0);
}

/** True for the shop default `(*, *)`, the rule that keeps completions unblocked. */
export function isShopDefault(rule: Pick<CommissionRuleDto, 'barberId' | 'serviceId'>): boolean {
  return !rule.barberId && !rule.serviceId;
}
