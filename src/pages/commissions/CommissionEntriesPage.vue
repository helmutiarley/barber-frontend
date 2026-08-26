<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
} from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listCommissionEntries } from '@/api/commissions';
import CommissionsTabs from '@/components/commissions/CommissionsTabs.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { usePermission } from '@/composables/usePermission';
import { COMMISSION_BASE_LABELS } from '@/features/commissions/labels';
import { formatRate } from '@/features/commissions/rate';
import { formatMoney } from '@/lib/money';
import {
  formatShopDateTime,
  shopDayEndUtcIso,
  shopDayStartUtcIso,
  shopToday,
} from '@/lib/shop-time';

const PAGE_SIZE = 50;

const route = useRoute();
const router = useRouter();
const { hasRole } = usePermission();
const { barberName, barberFilterOptions } = useBarberNames();

const isStaff = computed(() => hasRole('ADMIN', 'MANAGER'));
// The API already scopes a barber to their own rows, so the column would repeat
// their own name on every line.
const isBarber = computed(() => hasRole('BARBER'));

function defaultFrom(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 30 }).toISODate()!;
}

const from = computed({
  get: () => (typeof route.query.from === 'string' ? route.query.from : defaultFrom()),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, from: value || undefined, offset: undefined } });
  },
});

const to = computed({
  get: () => (typeof route.query.to === 'string' ? route.query.to : shopToday()),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, to: value || undefined, offset: undefined } });
  },
});

const barberId = computed({
  get: () => (typeof route.query.barberId === 'string' ? route.query.barberId : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, barberId: value ? String(value) : undefined, offset: undefined },
    });
  },
});

/** Set when arriving from a statement; narrows the ledger to that period. */
const periodId = computed(() =>
  typeof route.query.periodId === 'string' ? route.query.periodId : '',
);

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
        'commission-entries',
        {
          from: from.value,
          to: to.value,
          barberId: barberId.value || undefined,
          periodId: periodId.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listCommissionEntries({
      from: shopDayStartUtcIso(from.value),
      to: shopDayEndUtcIso(to.value),
      barberId: barberId.value || undefined,
      periodId: periodId.value || undefined,
      limit: PAGE_SIZE,
      offset: offset.value,
    }),
  enabled: computed(() => !rangeError.value),
});

// `isLoading`, not `isPending`: the query is disabled while the range is invalid,
// and a disabled query stays pending forever, so the skeleton would never leave.
const { isLoading: listLoading, isError: listFailed } = listQuery;

const rows = computed(() => listQuery.data.value?.data ?? []);
const total = computed(() => listQuery.data.value?.meta.total ?? 0);
const canPrev = computed(() => offset.value > 0);
const canNext = computed(() => offset.value + PAGE_SIZE < total.value);

const pageTotalCents = computed(() =>
  rows.value.reduce((sum, entry) => sum + entry.amountCents, 0),
);

function setOffset(next: number): void {
  void router.replace({
    query: { ...route.query, offset: next > 0 ? String(next) : undefined },
  });
}

function clearPeriod(): void {
  void router.replace({ query: { ...route.query, periodId: undefined, offset: undefined } });
}
</script>

<template>
  <PageLayout
    title="Comissões"
    subtitle="Lançamentos são fotografias: a taxa e a base ficam congeladas quando o horário é concluído."
  >
    <CommissionsTabs />

    <BCard class="entries__filters">
      <div class="entries__filters-row">
        <label class="entries__field">
          <span>De</span>
          <input v-model="from" type="date" class="entries__date" />
        </label>
        <label class="entries__field">
          <span>Até</span>
          <input v-model="to" type="date" class="entries__date" />
        </label>
        <BSelect
          v-if="isStaff"
          v-model="barberId"
          label="Barbeiro"
          :options="barberFilterOptions"
        />
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="entries__error">
        {{ rangeError }}
      </BText>
      <div v-if="periodId" class="entries__chip">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          Filtrando por um período fechado.
        </BText>
        <BButton size="small" variant="outline" color="neutral" @click="clearPeriod">
          Limpar
        </BButton>
      </div>
    </BCard>

    <BSkeletonLoader v-if="!rangeError && listLoading" height="240px" />

    <BEmptyState v-else-if="rangeError" title="Ajuste o período" :subtitle="rangeError" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum lançamento"
      subtitle="Comissões aparecem aqui quando um horário é concluído."
    />

    <template v-else>
      <BCard padding="0" class="entries__table-card">
        <div class="entries__table-wrap">
          <table class="entries__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th v-if="!isBarber">Barbeiro</th>
                <th>Origem</th>
                <th>Taxa</th>
                <th>Base</th>
                <th>Valor base</th>
                <th>Comissão</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatShopDateTime(row.createdAt) }}</td>
                <td v-if="!isBarber">{{ barberName(row.barberId) }}</td>
                <td>
                  <RouterLink
                    v-if="row.appointmentId"
                    :to="`/appointments/${row.appointmentId}`"
                    class="entries__link"
                  >
                    Horário
                  </RouterLink>
                  <span v-else-if="row.productSaleId">Venda de produto</span>
                  <span v-else>—</span>
                </td>
                <td>{{ formatRate(row.rate) }}</td>
                <td>{{ COMMISSION_BASE_LABELS[row.base] }}</td>
                <td>{{ formatMoney(row.baseAmountCents) }}</td>
                <td>{{ formatMoney(row.amountCents) }}</td>
                <td>
                  <RouterLink v-if="row.periodId" :to="`/commissions/periods/${row.periodId}`">
                    <BLabel color="success">Fechado</BLabel>
                  </RouterLink>
                  <BLabel v-else color="warning">Em aberto</BLabel>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="entries__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }} · soma da
          página {{ formatMoney(pageTotalCents) }}
        </BText>
        <div class="entries__pager-actions">
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
  </PageLayout>
</template>

<style scoped>
.entries__filters {
  margin-bottom: 1rem;
}

.entries__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .entries__filters-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }
}

.entries__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.entries__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-stroke-neutral-mid, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-default, #fff);
  color: inherit;
  font: inherit;
}

.entries__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-hover, #b42318);
}

.entries__chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.entries__table-card {
  overflow: hidden;
}

.entries__table-wrap {
  overflow-x: auto;
}

.entries__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.entries__table th,
.entries__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.entries__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.entries__link {
  color: var(--b-fg-brand-default, #2563eb);
  text-decoration: underline;
}

.entries__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.entries__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
