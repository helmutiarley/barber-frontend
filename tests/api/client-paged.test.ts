import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiRequestPaged,
  configureApiClient,
  resetApiClientForTests,
} from '@/api/client';

describe('apiRequestPaged', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubEnv('VITE_API_URL', 'http://api.test/v1');
    configureApiClient({
      fetch: fetchMock as unknown as typeof fetch,
      tokens: {
        getAccessToken: () => 'tok',
        getRefreshToken: () => null,
        setTokens: () => undefined,
        clearSession: () => undefined,
      },
    });
  });

  afterEach(() => {
    resetApiClientForTests();
    vi.unstubAllEnvs();
  });

  it('returns data and meta together', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ id: '1' }],
          meta: { total: 1, limit: 50, offset: 0 },
        }),
        { status: 200 },
      ),
    );

    const result = await apiRequestPaged<{ id: string }>('/appointments?from=a&to=b');
    expect(result).toEqual({
      data: [{ id: '1' }],
      meta: { total: 1, limit: 50, offset: 0 },
    });
  });
});
