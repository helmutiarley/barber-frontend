import { describe, expect, it } from 'vitest';
import { resolveNavigation } from '@/app/guards';

describe('resolveNavigation', () => {
  it('sends unauthenticated users to login with redirect', () => {
    expect(
      resolveNavigation({
        to: { fullPath: '/agenda', meta: { title: 'Agenda' } },
        isAuthenticated: false,
        role: null,
      }),
    ).toEqual({ path: '/login', query: { redirect: '/agenda' } });
  });

  it('blocks wrong roles', () => {
    expect(
      resolveNavigation({
        to: {
          fullPath: '/users',
          meta: { title: 'Usuários', roles: ['ADMIN'] },
        },
        isAuthenticated: true,
        role: 'BARBER',
      }),
    ).toEqual({ path: '/forbidden' });
  });

  it('redirects authenticated guests away from login', () => {
    expect(
      resolveNavigation({
        to: { fullPath: '/login', meta: { title: 'Entrar', guest: true } },
        isAuthenticated: true,
        role: 'MANAGER',
      }),
    ).toBe('/agenda');
  });

  it('allows matching roles', () => {
    expect(
      resolveNavigation({
        to: {
          fullPath: '/agenda',
          meta: { title: 'Agenda', roles: ['ADMIN', 'MANAGER', 'BARBER'] },
        },
        isAuthenticated: true,
        role: 'BARBER',
      }),
    ).toBe(true);
  });

  it('allows public routes without auth', () => {
    expect(
      resolveNavigation({
        to: { fullPath: '/missing', meta: { title: '404', public: true } },
        isAuthenticated: false,
        role: null,
      }),
    ).toBe(true);
  });
});
