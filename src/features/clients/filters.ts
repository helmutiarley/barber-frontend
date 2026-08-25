export const BIRTHDAY_MONTH_OPTIONS: { label: string; value: string }[] = [
  { label: 'Qualquer mês', value: '' },
  { label: 'Janeiro', value: '1' },
  { label: 'Fevereiro', value: '2' },
  { label: 'Março', value: '3' },
  { label: 'Abril', value: '4' },
  { label: 'Maio', value: '5' },
  { label: 'Junho', value: '6' },
  { label: 'Julho', value: '7' },
  { label: 'Agosto', value: '8' },
  { label: 'Setembro', value: '9' },
  { label: 'Outubro', value: '10' },
  { label: 'Novembro', value: '11' },
  { label: 'Dezembro', value: '12' },
];

/** UI presets for `inactiveSince` — API has no default. */
export const INACTIVE_SINCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Qualquer atividade', value: '' },
  { label: 'Sem visita há 30 dias', value: '30' },
  { label: 'Sem visita há 60 dias', value: '60' },
  { label: 'Sem visita há 90 dias', value: '90' },
];
