export type UserRole = 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT';

export const STAFF_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'BARBER'];
export const CASH_BANNER_ROLES: UserRole[] = ['ADMIN', 'MANAGER'];

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function homePathForRole(role: UserRole): string {
  if (role === 'CLIENT') {
    return '/book';
  }

  return '/agenda';
}
