<script setup lang="ts">
import {
  BButton,
  BCard,
  BDialog,
  BEmptyState,
  BInputArea,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listPayments, voidPayment } from '@/api/payments';
import type { PaymentDto, PaymentMethod } from '@/api/types';
import PageLayout from '@/components/layout/PageLayout.vue';
import { usePermission } from '@/composables/usePermission';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
} from '@/features/payments/method-labels';
import { fieldErrorsFromZod, voidPaymentSchema } from '@/features/payments/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import {
  formatShopDateTime,
  isSameShopDay,
  shopDayEndUtcIso,
  shopDayStartUtcIso,
  shopToday,
} from '@/lib/shop-time';
import { useCashRegisterStore } from '@/stores/cash-register';

const PAGE_SIZE = 50;
const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const { hasRole } = usePermission();
const cash = useCashRegisterStore();

const isAdmin = computed(() => hasRole('ADMIN'));

onMounted(() => {
  void cash.refresh();
});

function defaultFrom(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 7 }).toISODate()!;
}

function defaultTo(): string {
  return shopToday();
}

const from = computed({
  get: () => (typeof route.query.from === 'string' ? route.query.from : defaultFrom()),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, from: value || undefined, offset: undefined } });
  },
});

const to = computed({
  get: () => (typeof route.query.to === 'string' ? route.query.to : defaultTo()),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, to: value || undefined, offset: undefined } });
  },
});

const method = computed({
  get: () => (typeof route.query.method === 'string' ? route.query.method : ''),
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        method: value ? String(value) : undefined,
        offset: undefined,
      },
    });
  },
});

const offset = computed(() => {
  const raw = typeof route.query.offset === 'string' ? Number(route.query.offset) : 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const rangeError = computed(() => {
  const start = DateTime.fromISO(from.value);
  const end = DateTime.fromISO(to.value);
  if (!start.isValid || !end.isValid) return 'Informe datas válidas.';
  if (end < start) return 'A data final deve ser depois da inicial.';
  return null;
});

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'payments',
        {
          from: from.value,
          to: to.value,
          method: method.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listPayments({
      from: shopDayStartUtcIso(from.value),
      to: shopDayEndUtcIso(to.value),
      method: (method.value as PaymentMethod) || undefined,
      limit: PAGE_SIZE,
      offset: offset.value,
    }),
  enabled: computed(() => !rangeError.value),
});

// `isLoading`, not `isPending`: a disabled query stays pending forever, which
// would keep the skeleton up while the period is invalid.
const { isLoading: listLoading, isError: listFailed } = listQuery;

const rows = computed(() => listQuery.data.value?.data ?? []);
const total = computed(() => listQuery.data.value?.meta.total ?? 0);
const canPrev = computed(() => offset.value > 0);
const canNext = computed(() => offset.value + PAGE_SIZE < total.value);

function setOffset(next: number): void {
  void router.replace({
    query: {
      ...route.query,
      offset: next > 0 ? String(next) : undefined,
    },
  });
}

function canVoid(row: PaymentDto): boolean {
  if (!isAdmin.value || row.voidedAt) return false;
  if (!isSameShopDay(row.paidAt)) return false;
  if (row.method === 'cash' && cash.status === 'closed') return false;
  return true;
}

function voidDisabledReason(row: PaymentDto): string | null {
  if (!isAdmin.value || row.voidedAt) return null;
  if (!isSameShopDay(row.paidAt)) return 'Só no mesmo dia';
  if (row.method === 'cash' && cash.status === 'closed') return 'Abra o caixa';
  return null;
}

const voidTarget = ref<PaymentDto | null>(null);
const voidForm = reactive({ reason: '' });
const voidErrors = ref<Record<string, string>>({});
const voidPending = ref(false);

function openVoid(row: PaymentDto): void {
  voidTarget.value = row;
  voidForm.reason = '';
  voidErrors.value = {};
}

async function submitVoid(): Promise<void> {
  if (!voidTarget.value) return;
  voidErrors.value = {};
  const parsed = voidPaymentSchema.safeParse(voidForm);
  if (!parsed.success) {
    voidErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  voidPending.value = true;
  try {
    await voidPayment(voidTarget.value.id, parsed.data.reason);
    toast.add({ message: 'Pagamento estornado.', severity: 'success' });
    voidTarget.value = null;
    await queryClient.invalidateQueries({ queryKey: ['payments'] });
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao estornar.',
      severity: 'failure',
    });
  } finally {
    voidPending.value = false;
  }
}
</script>

<template>
  <PageLayout
    title="Pagamentos"
    subtitle="Recebimentos da loja. Estorno no mesmo dia (ADMIN)."
  >
    <BCard class="payments__filters">
      <div class="payments__filters-row">
        <label class="payments__field">
          <span>De</span>
          <input v-model="from" type="date" class="payments__date" />
        </label>
        <label class="payments__field">
          <span>Até</span>
          <input v-model="to" type="date" class="payments__date" />
        </label>
        <BSelect v-model="method" label="Forma" :options="PAYMENT_METHOD_OPTIONS" />
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="payments__error">
        {{ rangeError }}
      </BText>
    </BCard>

    <BSkeletonLoader v-if="!rangeError && listLoading" height="240px" />

    <BEmptyState v-else-if="rangeError" title="Ajuste o período" :subtitle="rangeError" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Confira o período e tente de novo."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum pagamento"
      subtitle="Não há recebimentos neste filtro."
    />

    <template v-else>
      <BCard padding="0" class="payments__table-card">
        <div class="payments__table-wrap">
          <table class="payments__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Forma</th>
                <th>Bruto</th>
                <th>Taxa</th>
                <th>Líquido</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.id"
                :class="{ 'payments__row--voided': row.voidedAt }"
              >
                <td>{{ formatShopDateTime(row.paidAt) }}</td>
                <td>{{ PAYMENT_METHOD_LABELS[row.method] }}</td>
                <td>{{ formatMoney(row.amountCents) }}</td>
                <td>{{ formatMoney(row.cardFeeCents) }}</td>
                <td>{{ formatMoney(row.netAmountCents) }}</td>
                <td>
                  <BLabel v-if="row.voidedAt" color="grayLight">Estornado</BLabel>
                  <BLabel v-else color="success">Ativo</BLabel>
                </td>
                <td class="payments__actions">
                  <RouterLink
                    v-if="row.appointmentId"
                    :to="`/appointments/${row.appointmentId}`"
                  >
                    <BButton size="small" variant="outline" color="neutral">Horário</BButton>
                  </RouterLink>
                  <BButton
                    v-if="canVoid(row)"
                    size="small"
                    variant="outline"
                    color="danger"
                    @click="openVoid(row)"
                  >
                    Estornar
                  </BButton>
                  <BText
                    v-else-if="voidDisabledReason(row)"
                    as="span"
                    variant="body-3"
                    color="b-fg-neutral-secondary"
                  >
                    {{ voidDisabledReason(row) }}
                  </BText>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="payments__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="payments__pager-actions">
          <BButton
            size="small"
            variant="outline"
            color="neutral"
            :is-disabled="!canPrev"
            @click="setOffset(Math.max(0, offset - PAGE_SIZE))"
          >
            Anterior
          </BButton>
          <BButton
            size="small"
            variant="outline"
            color="neutral"
            :is-disabled="!canNext"
            @click="setOffset(offset + PAGE_SIZE)"
          >
            Próxima
          </BButton>
        </div>
      </div>
    </template>

    <BDialog
      :is-open="voidTarget != null"
      title-text="Estornar pagamento?"
      width="420px"
      @update:is-open="(open: boolean) => !open && (voidTarget = null)"
    >
      <p v-if="voidTarget">
        Estornar {{ formatMoney(voidTarget.amountCents) }} em
        {{ PAYMENT_METHOD_LABELS[voidTarget.method] }}.
      </p>
      <BInputArea
        v-model="voidForm.reason"
        label="Motivo"
        label-prepend-asterisk
        rows="3"
        :helper-text="voidErrors.reason"
      />
      <template #footer>
        <BButton variant="outline" color="neutral" @click="voidTarget = null">Fechar</BButton>
        <BButton
          color="danger"
          variant="contain"
          :is-loading="voidPending"
          @click="submitVoid"
        >
          Confirmar estorno
        </BButton>
      </template>
    </BDialog>
  </PageLayout>
</template>

<style scoped>
.payments__filters {
  margin-bottom: 1rem;
}

.payments__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .payments__filters-row {
    grid-template-columns: 1fr 1fr 1fr;
    align-items: end;
  }
}

.payments__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.payments__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-stroke-neutral-mid, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-default, #fff);
  color: inherit;
  font: inherit;
}

.payments__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-hover, #b42318);
}

.payments__table-card {
  overflow: hidden;
}

.payments__table-wrap {
  overflow-x: auto;
}

.payments__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.payments__table th,
.payments__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.payments__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.payments__row--voided {
  opacity: 0.65;
}

.payments__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  justify-content: flex-end;
}

.payments__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.payments__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
