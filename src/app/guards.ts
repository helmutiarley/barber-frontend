import type { RouteLocationNormalized, Router } from 'vue-router';
import { homePathForRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';

export function installGuards(router: Router): void {
  router.beforeEach((to) => {
    const auth = useAuthStore();

    return resolveNavigation({
      to,
      isAuthenticated: auth.isAuthenticated,
      role: auth.role,
    });
  });
}

/** Pure helper for unit tests — same rules as the guard without Pinia. */
export function resolveNavigation(input: {
  to: Pick<RouteLocationNormalized, 'fullPath' | 'meta'>;
  isAuthenticated: boolean;
  role: string | null;
}): string | true | { path: string; query?: Record<string, string> } {
  if (input.to.meta.public) {
    return true;
  }

  const isGuestRoute = Boolean(input.to.meta.guest);
  const requiredRoles = input.to.meta.roles as string[] | undefined;

  if (isGuestRoute) {
    if (input.isAuthenticated && input.role) {
      return homePathForRole(input.role as 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT');
    }

    return true;
  }

  if (!input.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: input.to.fullPath },
    };
  }

  if (requiredRoles && requiredRoles.length > 0 && input.role) {
    if (!requiredRoles.includes(input.role)) {
      return { path: '/forbidden' };
    }
  }

  return true;
}
