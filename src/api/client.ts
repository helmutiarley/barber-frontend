import { parseErrorBody } from '@/lib/errors';
import type { PagedResult } from '@/api/types';

type JsonBody = Record<string, unknown> | undefined;

export type ApiRequestOptions = {
  method?: string;
  body?: JsonBody;
  /** Skip Authorization header and 401 refresh (login / refresh). */
  skipAuth?: boolean;
  /** Internal: already retried after refresh. */
  _retried?: boolean;
  signal?: AbortSignal;
};

type Envelope<T> = { data: T; meta?: PagedResult<T>['meta'] };

export type TokenAccessor = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
};

let tokenAccessor: TokenAccessor | null = null;
let authFailureHandler: (() => void) | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis);

export function configureApiClient(options: {
  tokens: TokenAccessor;
  onAuthFailure?: () => void;
  fetch?: typeof fetch;
}): void {
  tokenAccessor = options.tokens;
  authFailureHandler = options.onAuthFailure ?? null;
  if (options.fetch) {
    fetchImpl = options.fetch;
  }
}

/** Test helper — reset module state between cases. */
export function resetApiClientForTests(): void {
  tokenAccessor = null;
  authFailureHandler = null;
  refreshInFlight = null;
  fetchImpl = globalThis.fetch.bind(globalThis);
}

function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL;
  if (!base) {
    throw new Error('VITE_API_URL is not set');
  }

  return base.replace(/\/$/, '');
}

function isAuthPath(path: string): boolean {
  return path === '/auth/login' || path === '/auth/refresh' || path.startsWith('/auth/login?');
}

async function parseError(response: Response) {
  try {
    const json: unknown = await response.json();
    return parseErrorBody(json, response.status);
  } catch {
    return parseErrorBody(null, response.status);
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!tokenAccessor) {
    return false;
  }

  const refreshToken = tokenAccessor.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetchImpl(`${apiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          return false;
        }

        const json = (await response.json()) as Envelope<{
          accessToken: string;
          refreshToken: string;
        }>;

        tokenAccessor!.setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function send(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const method = options.method ?? (options.body ? 'POST' : 'GET');
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.skipAuth && tokenAccessor) {
    const access = tokenAccessor.getAccessToken();
    if (access) {
      headers.Authorization = `Bearer ${access}`;
    }
  }

  const response = await fetchImpl(`${apiBaseUrl()}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options._retried &&
    !isAuthPath(path)
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return send(path, { ...options, _retried: true });
    }

    tokenAccessor?.clearSession();
    authFailureHandler?.();
    throw await parseError(response);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await send(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as Envelope<T>;
  return json.data;
}

/** Lists that return `{ data, meta }` (appointments, clients, …). */
export async function apiRequestPaged<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<PagedResult<T>> {
  const response = await send(path, options);
  const json = (await response.json()) as { data: T[]; meta: PagedResult<T>['meta'] };
  return { data: json.data, meta: json.meta };
}
