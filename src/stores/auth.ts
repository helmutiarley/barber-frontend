import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as authApi from '@/api/auth';
import type { RegisterInput } from '@/api/auth';
import * as usersApi from '@/api/users';
import type { UpdateMeInput } from '@/api/users';
import type { UserDto } from '@/api/types';
import type { UserRole } from '@/lib/roles';

const REFRESH_KEY = 'barber.refreshToken';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const bootstrapped = ref(false);

  const isAuthenticated = computed(() => user.value !== null && accessToken.value !== null);
  const role = computed<UserRole | null>(() => user.value?.role ?? null);

  function readStoredRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  }

  function persistRefresh(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(REFRESH_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_KEY);
      }
    } catch {
      // private mode / denied — session lasts until reload only
    }
  }

  function setTokens(nextAccess: string, nextRefresh: string): void {
    accessToken.value = nextAccess;
    refreshToken.value = nextRefresh;
    persistRefresh(nextRefresh);
  }

  function setSession(result: { accessToken: string; refreshToken: string; user: UserDto }): void {
    setTokens(result.accessToken, result.refreshToken);
    user.value = result.user;
  }

  function setUser(next: UserDto): void {
    user.value = next;
  }

  function clearSession(): void {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    persistRefresh(null);
  }

  async function login(email: string, password: string): Promise<void> {
    const result = await authApi.login(email.trim().toLowerCase(), password);
    setSession(result);
  }

  async function register(input: RegisterInput): Promise<void> {
    const result = await authApi.register({
      ...input,
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
    });
    setSession(result);
  }

  async function updateMe(input: UpdateMeInput): Promise<UserDto> {
    const updated = await usersApi.updateMe(input);
    user.value = updated;
    return updated;
  }

  async function logout(): Promise<void> {
    const token = refreshToken.value;
    clearSession();
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // already logged out locally
      }
    }
  }

  async function bootstrap(): Promise<void> {
    if (bootstrapped.value) {
      return;
    }

    const stored = readStoredRefresh();
    if (!stored) {
      bootstrapped.value = true;
      return;
    }

    refreshToken.value = stored;

    try {
      const result = await authApi.refresh(stored);
      setSession(result);
    } catch {
      clearSession();
    } finally {
      bootstrapped.value = true;
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    bootstrapped,
    isAuthenticated,
    role,
    setTokens,
    setSession,
    setUser,
    clearSession,
    login,
    register,
    updateMe,
    logout,
    bootstrap,
    getAccessToken: () => accessToken.value,
    getRefreshToken: () => refreshToken.value ?? readStoredRefresh(),
  };
});
