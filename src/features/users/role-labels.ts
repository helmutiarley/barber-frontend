import type { UserRole } from '@/lib/roles';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  BARBER: 'Barbeiro',
  CLIENT: 'Cliente',
};

export function activeLabel(active: boolean): string {
  return active ? 'Ativo' : 'Inativo';
}

export const ROLE_FILTER_OPTIONS = [
  { label: 'Todos os perfis', value: '' },
  { label: ROLE_LABELS.ADMIN, value: 'ADMIN' },
  { label: ROLE_LABELS.MANAGER, value: 'MANAGER' },
  { label: ROLE_LABELS.BARBER, value: 'BARBER' },
  { label: ROLE_LABELS.CLIENT, value: 'CLIENT' },
];

export const ACTIVE_FILTER_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' },
];

export const STAFF_ROLE_OPTIONS = [
  { label: ROLE_LABELS.MANAGER, value: 'MANAGER' },
  { label: ROLE_LABELS.BARBER, value: 'BARBER' },
];

export const ALL_ROLE_OPTIONS = [
  { label: ROLE_LABELS.ADMIN, value: 'ADMIN' },
  { label: ROLE_LABELS.MANAGER, value: 'MANAGER' },
  { label: ROLE_LABELS.BARBER, value: 'BARBER' },
  { label: ROLE_LABELS.CLIENT, value: 'CLIENT' },
];
