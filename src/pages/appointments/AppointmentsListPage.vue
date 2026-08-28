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
import { listAppointments } from '@/api/appointments';
import { listBarbers } from '@/api/barbers';
import { listServices } from '@/api/services';
import type { AppointmentStatus } from '@/api/types';
import AppointmentPaymentLabel from '@/components/AppointmentPaymentLabel.vue';
import AppointmentsTabs from '@/components/AppointmentsTabs.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_OPTIONS,
} from '@/features/appointments/status-labels';
import { formatMoney } from '@/lib/money';
import {
  formatShopDateTime,
  shopDayEndUtcIso,
  shopDayStartUtcIso,
  shopToday,
} from '@/lib/shop-time';

const PAGE_SIZE = 50;
const MAX_RANGE_DAYS = 92;

const route = useRoute();
const router = useRouter();

function defaultFrom(): string {
  return shopToday();
}

function defaultTo(): string {
  return DateTime.fromISO(shopToday()).plus({ days: 7 }).toISODate()!;
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

const barberId = computed({
  get: () => (typeof route.query.barberId === 'string' ? route.query.barberId : ''),
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        barberId: value ? String(value) : undefined,
        offset: undefined,
      },
    });
  },
});

const status = computed({
  get: () => (typeof route.query.status === 'string' ? route.query.status : ''),
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        status: value ? String(value) : undefined,
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
  if (end.diff(start, 'days').days > MAX_RANGE_DAYS) {
    return `O intervalo máximo é ${MAX_RANGE_DAYS} dias.`;
  }
  return null;
});

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: true }] as const,
  queryFn: () => listServices({ includeInactive: true }),
});

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'appointments',
        {
          from: from.value,
          to: to.value,
          barberId: barberId.value || undefined,
          status: status.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listAppointments({
      from: shopDayStartUtcIso(from.value),
      to: shopDayEndUtcIso(to.value),
      barberId: barberId.value || undefined,
      status: (status.value as AppointmentStatus) || undefined,
      limit: PAGE_SIZE,
      offset: offset.value,
    }),
  enabled: computed(() => !rangeError.value),
});

// `isLoading`, not `isPending`: while the range is invalid the query is disabled
// and stays pending forever, which would keep the skeleton up for good.
const { isLoading: listLoading, isError: listFailed } = listQuery;

const barberOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...(barbersQuery.data.value ?? []).map((b) => ({ label: b.displayName, value: b.id })),
]);

const serviceName = computed(() => {
  const map = new Map((servicesQuery.data.value ?? []).map((s) => [s.id, s.name]));
  return (id: string) => map.get(id) ?? 'Serviço';
});

const barberName = computed(() => {
  const map = new Map((barbersQuery.data.value ?? []).map((b) => [b.id, b.displayName]));
  return (id: string) => map.get(id) ?? 'Barbeiro';
});

const total = computed(() => listQuery.data.value?.meta.total ?? 0);
const rows = computed(() => listQuery.data.value?.data ?? []);
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
</script>

<template>
  <PageLayout
    title="Agenda"
    subtitle="Consulte agendamentos por período, barbeiro e status."
  >
    <template #header-actions>
      <RouterLink to="/appointments/new">
        <BButton color="neutral" variant="contain" icon-prepend="ic-add-16">Novo horário</BButton>
      </RouterLink>
    </template>

    <AppointmentsTabs />

    <BCard class="list__filters">
      <div class="list__filters-row">
        <label class="list__field">
          <span>De</span>
          <input v-model="from" type="date" class="list__date" />
        </label>
        <label class="list__field">
          <span>Até</span>
          <input v-model="to" type="date" class="list__date" />
        </label>
        <BSelect v-model="barberId" label="Barbeiro" :options="barberOptions" />
        <BSelect
          v-model="status"
          label="Status"
          :options="APPOINTMENT_STATUS_OPTIONS"
        />
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="list__error">
        {{ rangeError }}
      </BText>
    </BCard>

    <BSkeletonLoader v-if="!rangeError && listLoading" height="240px" />

    <BEmptyState
      v-else-if="rangeError"
      title="Ajuste o período"
      :subtitle="rangeError"
    />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Confira o período e tente de novo."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum horário"
      subtitle="Não há agendamentos neste filtro."
    />

    <template v-else>
      <BCard padding="0" class="list__table-card">
        <div class="list__table-wrap">
          <table class="list__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Barbeiro</th>
                <th>Serviço</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>
                  <BText as="span" variant="body-2-bold">
                    {{ formatShopDateTime(row.startsAt) }}
                  </BText>
                </td>
                <td>{{ barberName(row.barberId) }}</td>
                <td>{{ serviceName(row.serviceId) }}</td>
                <td>{{ formatMoney(row.priceCents) }}</td>
                <td>
                  <BLabel :color="APPOINTMENT_STATUS_COLORS[row.status]">
                    {{ APPOINTMENT_STATUS_LABELS[row.status] }}
                  </BLabel>
                </td>
                <td>
                  <AppointmentPaymentLabel :is-paid="row.isPaid" />
                </td>
                <td>
                  <RouterLink :to="`/appointments/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="list__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="list__pager-actions">
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
.list__filters {
  margin-bottom: 1rem;
}

.list__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .list__filters-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: end;
  }
}

.list__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.list__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-stroke-neutral-mid, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-default, #fff);
  color: inherit;
  font: inherit;
}

.list__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-hover, #b42318);
}

.list__table-card {
  overflow: hidden;
}

.list__table-wrap {
  overflow-x: auto;
}

.list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.list__table th,
.list__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.list__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.list__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.list__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
