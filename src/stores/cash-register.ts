import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getCurrentSession } from '@/api/cash-register';
import { CASH_BANNER_ROLES } from '@/lib/roles';
import { isBeforeShopToday } from '@/lib/shop-time';
import { useAuthStore } from '@/stores/auth';

export type CashStatus = 'unknown' | 'open' | 'closed';

export const useCashRegisterStore = defineStore('cashRegister', () => {
  const status = ref<CashStatus>('unknown');
  const openedAt = ref<string | null>(null);
  const loading = ref(false);

  const isOvernightOpen = computed(() => {
    if (status.value !== 'open' || !openedAt.value) {
      return false;
    }

    return isBeforeShopToday(openedAt.value);
  });

  async function refresh(): Promise<void> {
    const auth = useAuthStore();
    const role = auth.role;
    if (!role || !CASH_BANNER_ROLES.includes(role)) {
      status.value = 'unknown';
      openedAt.value = null;
      return;
    }

    loading.value = true;
    try {
      const current = await getCurrentSession();
      if (current) {
        status.value = 'open';
        openedAt.value = current.session.openedAt;
      } else {
        status.value = 'closed';
        openedAt.value = null;
      }
    } catch {
      status.value = 'unknown';
      openedAt.value = null;
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    status.value = 'unknown';
    openedAt.value = null;
  }

  return {
    status,
    openedAt,
    loading,
    isOvernightOpen,
    refresh,
    reset,
  };
});
