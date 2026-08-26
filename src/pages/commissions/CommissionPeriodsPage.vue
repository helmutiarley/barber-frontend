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
import { listCommissionPeriods } from '@/api/commissions';
import type { CommissionPeriodStatus } from '@/api/types';
import CommissionsTabs from '@/components/commissions/CommissionsTabs.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { usePermission } from '@/composables/usePermission';
import {
  PERIOD_STATUS_COLORS,
  PERIOD_STATUS_FILTER_OPTIONS,
  PERIOD_STATUS_LABELS,
} from '@/features/commissions/labels';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/method-labels';
import { formatMoney } from '@/lib/money';

const PAGE_SIZE = 50;

const route = useRoute();
const router = useRouter();
const { hasRole } = usePermission();
const { barberName, barberFilterOptions } = useBarberNames();

const isStaff = computed(() => hasRole('ADMIN', 'MANAGER'));
const isAdmin = computed(() => hasRole('ADMIN'));
const isBarber = computed(() => hasRole('BARBER'));

const barberId = computed({
  get: () => (typeof route.query.barberId === 'string' ? route.query.barberId : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, barberId: value ? String(value) : undefined, offset: undefined },
    });
  },
});

const status = computed({
  get: () => (typeof route.query.status === 'string' ? route.query.status : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, status: value ? String(value) : undefined, offset: undefined },
    });
  },
});

const offset = computed(() => {
  const raw = typeof route.query.offset === 'string' ? Number(route.query.offset) : 0;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'commission-periods',
        {
          barberId: barberId.value || undefined,
          status: status.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listCommissionPeriods({
      barberId: barberId.value || undefined,
      status: (status.value as CommissionPeriodStatus) || undefined,
      limit: PAGE_SIZE,
      offset: offset.value,
    }),
});

const { isPending: listPending, isError: listFailed } = listQuery;

const rows = computed(() => listQuery.data.value?.data ?? []);
const total = computed(() => listQuery.data.value?.meta.total ?? 0);
const canPrev = computed(() => offset.value > 0);
const canNext = computed(() => offset.value + PAGE_SIZE < total.value);

function setOffset(next: number): void {
  void router.replace({
    query: { ...route.query, offset: next > 0 ? String(next) : undefined },
  });
}

function formatRange(startsOn: string, endsOn: string): string {
  const start = DateTime.fromISO(startsOn);
  const end = DateTime.fromISO(endsOn);
  if (!start.isValid || !end.isValid) return `${startsOn} – ${endsOn}`;
  return `${start.toFormat('dd/MM/yyyy')} – ${end.toFormat('dd/MM/yyyy')}`;
}
</script>

<template>
  <PageLayout
    title="Comissões"
    subtitle="Um período existe só depois de fechado: o que ninguém acertou ainda são os lançamentos em aberto."
  >
    <template v-if="isAdmin" #header-actions>
      <RouterLink to="/commissions/periods/close">
        <BButton color="neutral" variant="contain">Fechar período</BButton>
      </RouterLink>
    </template>

    <CommissionsTabs />

    <BCard v-if="isStaff" class="periods__filters">
      <div class="periods__filters-row">
        <BSelect v-model="barberId" label="Barbeiro" :options="barberFilterOptions" />
        <BSelect v-model="status" label="Situação" :options="PERIOD_STATUS_FILTER_OPTIONS" />
      </div>
    </BCard>

    <BSkeletonLoader v-if="listPending" height="240px" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum período"
      subtitle="Feche um intervalo já encerrado para gerar o acerto."
    >
      <template v-if="isAdmin" #actions>
        <RouterLink to="/commissions/periods/close">
          <BButton color="neutral" variant="contain">Fechar período</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <template v-else>
      <BCard padding="0" class="periods__table-card">
        <div class="periods__table-wrap">
          <table class="periods__table">
            <thead>
              <tr>
                <th>Período</th>
                <th v-if="!isBarber">Barbeiro</th>
                <th>Lançamentos</th>
                <th>Vales</th>
                <th>A pagar</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatRange(row.startsOn, row.endsOn) }}</td>
                <td v-if="!isBarber">{{ barberName(row.barberId) }}</td>
                <td>{{ formatMoney(row.totalEntriesCents) }}</td>
                <td>{{ formatMoney(row.totalAdvancesCents) }}</td>
                <td :class="{ 'periods__negative': row.totalDueCents < 0 }">
                  {{ formatMoney(row.totalDueCents) }}
                </td>
                <td>
                  <div class="periods__status">
                    <BLabel :color="PERIOD_STATUS_COLORS[row.status]">
                      {{ PERIOD_STATUS_LABELS[row.status] }}
                    </BLabel>
                    <BText
                      v-if="row.paymentMethod"
                      as="span"
                      variant="body-3"
                      color="b-fg-neutral-secondary"
                    >
                      {{ PAYMENT_METHOD_LABELS[row.paymentMethod] }}
                    </BText>
                  </div>
                </td>
                <td class="periods__actions">
                  <RouterLink :to="`/commissions/periods/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Extrato</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="periods__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="periods__pager-actions">
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
.periods__filters {
  margin-bottom: 1rem;
}

.periods__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .periods__filters-row {
    grid-template-columns: 1fr 1fr;
    align-items: end;
  }
}

.periods__table-card {
  overflow: hidden;
}

.periods__table-wrap {
  overflow-x: auto;
}

.periods__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.periods__table th,
.periods__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.periods__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.periods__negative {
  color: var(--b-fg-danger-hover, #b42318);
}

.periods__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.periods__actions {
  text-align: right;
}

.periods__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.periods__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
