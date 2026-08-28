import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDto } from '@/api/types';
import { createBarberApp } from '@/app/create-app';
import { staffNavSections } from '@/app/nav';
import { router } from '@/app/router';
import { useAuthStore } from '@/stores/auth';

const ADMIN: UserDto = {
  id: 'admin-1',
  name: 'Helena Admin',
  email: 'helena@barber.local',
  phone: null,
  role: 'ADMIN',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function mountStaffShell(path: string) {
  const app = createBarberApp();
  const errors: unknown[] = [];
  app.config.errorHandler = (error) => errors.push(error);
  app.use(router);

  useAuthStore().setSession({ accessToken: 'a', refreshToken: 'r', user: ADMIN });

  await router.push(path);
  await router.isReady();

  const host = document.createElement('div');
  document.body.appendChild(host);
  app.mount(host);
  await vi.waitFor(() => expect(host.querySelector('nav')).not.toBeNull());

  return { app, host, errors };
}

describe('staff shell', () => {
  beforeEach(() => {
    // The list pages fetch through TanStack Query; the chrome must render regardless.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore().clearSession();
  });

  it('renders the drawer with its section groups and the toolbar brand', async () => {
    const { app, host, errors } = await mountStaffShell('/users');

    expect(errors).toEqual([]);
    expect(host.querySelector('.site-layout')).not.toBeNull();
    expect(host.querySelector('.topbar')).not.toBeNull();
    expect(host.querySelector('.drawer')).not.toBeNull();

    const text = host.textContent ?? '';
    for (const label of staffNavSections.map((s) => s.label).filter(Boolean)) {
      expect(text).toContain(label);
    }
    expect(text).toContain('Barber');
    expect(text).toContain('Helena Admin');
    expect(text).toContain('Sair');

    app.unmount();
  });

  it('marks only the current route as the active nav item', async () => {
    const { app, host } = await mountStaffShell('/users');

    const active = [...host.querySelectorAll('.nav-item__link--active')];
    expect(active).toHaveLength(1);
    expect(active[0]?.getAttribute('href')).toBe('/users');
    expect(active[0]?.getAttribute('aria-current')).toBe('page');

    app.unmount();
  });

  it('keeps Agenda active while management uses the consultation tab', async () => {
    const { app, host } = await mountStaffShell('/appointments');

    const active = [...host.querySelectorAll('.nav-item__link--active')];
    expect(active).toHaveLength(1);
    expect(active[0]?.getAttribute('href')).toBe('/agenda');
    expect(host.querySelector('.drawer a[href="/appointments"]')).toBeNull();
    expect(host.textContent).toContain('Dia');
    expect(host.textContent).toContain('Consulta');

    app.unmount();
  });

  it('wraps page content in the shared page layout', async () => {
    const { app, host } = await mountStaffShell('/users');

    const layout = host.querySelector('.page-layout');
    expect(layout).not.toBeNull();
    expect(layout?.querySelector('h1')?.textContent).toContain('Usuários');

    app.unmount();
  });
});
