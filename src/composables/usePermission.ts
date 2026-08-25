import { computed } from 'vue';
import type { UserRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';

export function usePermission() {
  const auth = useAuthStore();

  const role = computed(() => auth.role);

  function hasRole(...roles: UserRole[]): boolean {
    const current = auth.role;
    if (!current) {
      return false;
    }

    return roles.includes(current);
  }

  function canAccessNav(roles: UserRole[]): boolean {
    return hasRole(...roles);
  }

  return {
    role,
    hasRole,
    canAccessNav,
  };
}
