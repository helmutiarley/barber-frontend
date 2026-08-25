import { computed, ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { getBarberAgenda } from '@/api/appointments';
import { listBarbers } from '@/api/barbers';
import { ApiError } from '@/lib/errors';
import { shopToday } from '@/lib/shop-time';
import { usePermission } from '@/composables/usePermission';

const STORAGE_KEY = 'barber.ownBarberId';

/**
 * Backend has no `GET /barbers/me`. For BARBER, probe each public barber's
 * agenda until one returns 200 (403 = not own chair).
 */
export function useOwnBarberId() {
  const { hasRole } = usePermission();
  const isBarber = computed(() => hasRole('BARBER'));
  const resolved = ref<string | null>(readCache());
  const resolving = ref(false);
  const resolveError = ref<string | null>(null);

  const barbersQuery = useQuery({
    queryKey: ['barbers', 'public'] as const,
    queryFn: () => listBarbers(),
    enabled: isBarber,
  });

  watch(
    () => barbersQuery.data.value,
    async (barbers) => {
      if (!isBarber.value || !barbers?.length) {
        return;
      }

      if (resolved.value && barbers.some((b) => b.id === resolved.value)) {
        return;
      }

      resolving.value = true;
      resolveError.value = null;
      try {
        const date = shopToday();
        for (const barber of barbers) {
          try {
            await getBarberAgenda(barber.id, date);
            resolved.value = barber.id;
            writeCache(barber.id);
            return;
          } catch (error) {
            if (error instanceof ApiError && (error.status === 403 || error.code === 'FORBIDDEN')) {
              continue;
            }
            throw error;
          }
        }
        resolved.value = null;
        resolveError.value = 'Não encontramos o seu perfil de barbeiro.';
      } catch {
        resolveError.value = 'Não foi possível identificar o seu perfil.';
      } finally {
        resolving.value = false;
      }
    },
    { immediate: true },
  );

  return {
    ownBarberId: resolved,
    resolving,
    resolveError,
    isBarber,
  };
}

function readCache(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeCache(id: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}
