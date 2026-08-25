import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  configureApiClient,
  resetApiClientForTests,
} from '@/api/client';
import { ApiError } from '@/lib/errors';

describe('apiRequest refresh', () => {
  const fetchMock = vi.fn();
  let access: string | null = 'old-access';
  let refresh: string | null = 'old-refresh';
  const clearSession = vi.fn(() => {
    access = null;
    refresh = null;
  });
  const onAuthFailure = vi.fn();

  beforeEach(() => {
    access = 'old-access';
    refresh = 'old-refresh';
    clearSession.mockClear();
    onAuthFailure.mockClear();
    fetchMock.mockReset();
    vi.stubEnv('VITE_API_URL', 'http://api.test/v1');
    configureApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      tokens: {
        getAccessToken: () => access,
        getRefreshToken: () => refresh,
        setTokens: (a, r) => {
          access = a;
          refresh = r;
        },
        clearSession,
      },
      onAuthFailure,
    });
  });

  afterEach(() => {
    resetApiClientForTests();
    vi.unstubAllEnvs();
  });

  it('refreshes once on 401 and retries the request', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'expired' } }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { accessToken: 'new-access', refreshToken: 'new-refresh', user: {} },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }),
      );

    const data = await apiRequest<{ ok: boolean }>('/appointments');

    expect(data).toEqual({ ok: true });
    expect(access).toBe('new-access');
    expect(refresh).toBe('new-refresh');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('clears session when refresh fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'expired' } }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'bad' } }), {
          status: 401,
        }),
      );

    await expect(apiRequest('/appointments')).rejects.toBeInstanceOf(ApiError);
    expect(clearSession).toHaveBeenCalled();
    expect(onAuthFailure).toHaveBeenCalled();
  });
});
