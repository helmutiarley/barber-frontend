<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSkeletonLoader,
  BText,
} from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listSessions } from '@/api/cash-register';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
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

function defaultFrom(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 30 }).toISODate()!;
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
      ['cash-register', 'sessions', { from: from.value, to: to.value, offset: offset.value }] as const,
  ),
  queryFn: () =>
    listSessions({
      from: shopDayStartUtcIso(from.value),
      to: shopDayEndUtcIso(to.value),
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
</script>

<template>
  <PageLayout subtitle="Sessões abertas e fechadas no período.">
    <template #title>
      <div class="sessions__title">
        <PageBackLink to="/cash-register" label="Caixa" />
        <BText as="h1" variant="heading-1">Histórico de caixa</BText>
      </div>
    </template>

    <BCard class="sessions__filters">
      <div class="sessions__filters-row">
        <label class="sessions__field">
          <span>De</span>
          <input v-model="from" type="date" class="sessions__date" />
        </label>
        <label class="sessions__field">
          <span>Até</span>
          <input v-model="to" type="date" class="sessions__date" />
        </label>
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="sessions__error">
        {{ rangeError }}
      </BText>
    </BCard>

    <BSkeletonLoader v-if="!rangeError && listLoading" height="200px" />

    <BEmptyState v-else-if="rangeError" title="Ajuste o período" :subtitle="rangeError" />

    <BEmptyState
      v-else-if="listFailed"
      title="Não foi possível carregar"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nenhuma sessão"
      subtitle="Não há caixas neste período."
    />

    <template v-else>
      <BCard padding="0" class="sessions__table-card">
        <div class="sessions__table-wrap">
          <table class="sessions__table">
            <thead>
              <tr>
                <th>Abertura</th>
                <th>Status</th>
                <th>Abertura R$</th>
                <th>Esperado</th>
                <th>Contado</th>
                <th>Diferença</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatShopDateTime(row.openedAt) }}</td>
                <td>
                  <BLabel :color="row.status === 'open' ? 'primary' : 'grayLight'">
                    {{ row.status === 'open' ? 'Aberto' : 'Fechado' }}
                  </BLabel>
                </td>
                <td>{{ formatMoney(row.openingBalanceCents) }}</td>
                <td>
                  {{
                    row.expectedBalanceCents != null
                      ? formatMoney(row.expectedBalanceCents)
                      : '—'
                  }}
                </td>
                <td>
                  {{
                    row.countedBalanceCents != null
                      ? formatMoney(row.countedBalanceCents)
                      : '—'
                  }}
                </td>
                <td>
                  {{
                    row.differenceCents != null ? formatMoney(row.differenceCents) : '—'
                  }}
                </td>
                <td>
                  <RouterLink :to="`/cash-register/sessions/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="sessions__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="sessions__pager-actions">
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
.sessions__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sessions__filters {
  margin-bottom: 1rem;
}

.sessions__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr;
}

.sessions__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.sessions__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-border-neutral-primary, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-primary, #fff);
  color: inherit;
  font: inherit;
}

.sessions__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-primary, #b42318);
}

.sessions__table-card {
  overflow: hidden;
}

.sessions__table-wrap {
  overflow-x: auto;
}

.sessions__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.sessions__table th,
.sessions__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.sessions__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.sessions__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.sessions__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
