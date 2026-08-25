import type { RevenueGrouping } from '@/api/types';

export const REVENUE_GROUPING_LABELS: Record<RevenueGrouping, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
  barber: 'Barbeiro',
  service: 'Serviço',
  method: 'Forma de pagamento',
};

export const REVENUE_GROUPING_OPTIONS: { label: string; value: RevenueGrouping }[] = [
  { label: REVENUE_GROUPING_LABELS.day, value: 'day' },
  { label: REVENUE_GROUPING_LABELS.week, value: 'week' },
  { label: REVENUE_GROUPING_LABELS.month, value: 'month' },
  { label: REVENUE_GROUPING_LABELS.barber, value: 'barber' },
  { label: REVENUE_GROUPING_LABELS.service, value: 'service' },
  { label: REVENUE_GROUPING_LABELS.method, value: 'method' },
];

export const REVENUE_GROUPINGS: RevenueGrouping[] = [
  'day',
  'week',
  'month',
  'barber',
  'service',
  'method',
];

export function isRevenueGrouping(value: unknown): value is RevenueGrouping {
  return typeof value === 'string' && (REVENUE_GROUPINGS as string[]).includes(value);
}

export type ReportCard = {
  path: string;
  title: string;
  description: string;
  icon: string;
};

/** The hub. Ordered money first, then the chair, then the shelf. */
export const REPORT_CARDS: ReportCard[] = [
  {
    path: '/reports/revenue',
    title: 'Faturamento',
    description: 'Bruto e líquido por dia, barbeiro, serviço ou forma de pagamento.',
    icon: 'ic-dollar-sign-sack-24',
  },
  {
    path: '/reports/dre',
    title: 'DRE simplificado',
    description: 'Receita menos taxas de cartão, despesas pagas e comissões.',
    icon: 'ic-graph-arrow-up-24',
  },
  {
    path: '/reports/average-ticket',
    title: 'Ticket médio',
    description: 'Só serviços: um atendimento é um ticket, produto não conta.',
    icon: 'ic-tag-24',
  },
  {
    path: '/reports/occupancy',
    title: 'Ocupação',
    description: 'Minutos agendados sobre minutos de trabalho, por barbeiro.',
    icon: 'ic-clock-circle-24',
  },
  {
    path: '/reports/no-shows',
    title: 'Faltas e cancelamentos',
    description: 'Quem não apareceu e quem desmarcou, com as taxas.',
    icon: 'ic-calendar-24',
  },
  {
    path: '/reports/top-services',
    title: 'Serviços mais vendidos',
    description: 'Ranking por receita ou por número de atendimentos.',
    icon: 'ic-bars-bullets-numbers-24',
  },
  {
    path: '/reports/clients',
    title: 'Clientes',
    description: 'Novos, recorrentes e quantos sumiram no período.',
    icon: 'ic-person-24',
  },
  {
    path: '/reports/products',
    title: 'Produtos',
    description: 'Unidades, receita, margem aproximada e estoque baixo.',
    icon: 'ic-box-24',
  },
];
