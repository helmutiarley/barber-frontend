import type { AppointmentStatus } from '@/api/types';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

/** BLabel color tokens used across agenda / list / detail. */
export const APPOINTMENT_STATUS_COLORS: Record<
  AppointmentStatus,
  'gray' | 'primary' | 'success' | 'grayLight' | 'warning'
> = {
  scheduled: 'gray',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'grayLight',
  no_show: 'warning',
};

export const APPOINTMENT_STATUS_OPTIONS: { label: string; value: AppointmentStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: APPOINTMENT_STATUS_LABELS.scheduled, value: 'scheduled' },
  { label: APPOINTMENT_STATUS_LABELS.confirmed, value: 'confirmed' },
  { label: APPOINTMENT_STATUS_LABELS.completed, value: 'completed' },
  { label: APPOINTMENT_STATUS_LABELS.cancelled, value: 'cancelled' },
  { label: APPOINTMENT_STATUS_LABELS.no_show, value: 'no_show' },
];
