import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiClient, resetApiClientForTests } from '@/api/client';
import type { AppointmentDto, UserDto } from '@/api/types';
import { createBarberApp } from '@/app/create-app';
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

const BARBER_ID = 'c710aee2-d30f-41c8-8b65-2e1ff7ed38e0';

const APPOINTMENT: AppointmentDto = {
  id: 'appointment-1',
  clientId: 'client-1',
  barberId: BARBER_ID,
  serviceId: 'service-1',
  status: 'scheduled',
  startsAt: '2026-08-07T13:00:00.000Z',
  endsAt: '2026-08-07T13:30:00.000Z',
  priceCents: 5000,
  durationMinutes: 30,
  notes: null,
  cancelledReason: null,
  cancelledBy: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function json(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The agenda path has to be matched first — it lives under `/barbers/:id`. */
function fakeApi(agenda: AppointmentDto[]): typeof fetch {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/agenda')) {
      return Promise.resolve(json(agenda));
    }
    if (url.includes('/barbers')) {
      return Promise.resolve(
        json([{ id: BARBER_ID, displayName: 'Bruno', photoUrl: null, specialties: [] }]),
      );
    }
    if (url.includes('/services')) {
      return Promise.resolve(
        json([{ id: 'service-1', name: 'Corte degradê', priceCents: 5000, durationMinutes: 30 }]),
      );
    }

    return Promise.resolve(json([]));
  }) as unknown as typeof fetch;
}

async function mountAgenda(agenda: AppointmentDto[]) {
  const app = createBarberApp();
  app.use(router);

  const auth = useAuthStore();
  auth.setSession({ accessToken: 'a', refreshToken: 'r', user: ADMIN });

  configureApiClient({
    tokens: {
      getAccessToken: () => auth.getAccessToken(),
      getRefreshToken: () => auth.getRefreshToken(),
      setTokens: () => {},
      clearSession: () => auth.clearSession(),
    },
    fetch: fakeApi(agenda),
  });

  await router.push(`/agenda?barberId=${BARBER_ID}&date=2026-08-07`);
  await router.isReady();

  const host = document.createElement('div');
  document.body.appendChild(host);
  app.mount(host);

  return { app, host };
}

describe('agenda page', () => {
  afterEach(() => {
    resetApiClientForTests();
    useAuthStore().clearSession();
  });

  /**
   * Regression: `useQuery` returns an object of refs and templates only unwrap
   * top-level bindings, so reaching through the query object in markup yields a
   * ref — always truthy — and the skeleton never came down.
   */
  it('replaces the skeleton with the day once the agenda resolves', async () => {
    const { app, host } = await mountAgenda([APPOINTMENT]);

    await vi.waitFor(() => expect(host.textContent).toContain('Corte degradê'));
    expect(host.querySelector('[class*="skeleton"]')).toBeNull();

    app.unmount();
  });

  it('shows the empty state rather than a skeleton on a free day', async () => {
    const { app, host } = await mountAgenda([]);

    await vi.waitFor(() => expect(host.textContent).toContain('Nada neste dia'));
    expect(host.querySelector('[class*="skeleton"]')).toBeNull();

    app.unmount();
  });
});
