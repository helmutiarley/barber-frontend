<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
} from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { DateTime } from 'luxon';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listExpenses } from '@/api/expenses';
import type { ExpenseCategory, ExpenseKind } from '@/api/types';
import PageLayout from '@/components/layout/PageLayout.vue';
import {
  EXPENSE_CATEGORY_FILTER_OPTIONS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_KIND_FILTER_OPTIONS,
  EXPENSE_KIND_LABELS,
  EXPENSE_STATUS_FILTER_OPTIONS,
  statusFilterToQuery,
} from '@/features/expenses/labels';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/method-labels';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime, shopDayEndUtcIso, shopDayStartUtcIso } from '@/lib/shop-time';

const PAGE_SIZE = 50;
const route = useRoute();
const router = useRouter();

function queryParam(key: string): string {
  return typeof route.query[key] === 'string' ? (route.query[key] as string) : '';
}

function setParam(key: string, value: string | number): void {
  void router.replace({
    query: {
      ...route.query,
      [key]: value ? String(value) : undefined,
      offset: undefined,
    },
  });
}

const status = computed({
  get: () => queryParam('status'),
  set: (value: string | number) => setParam('status', value),
});

const category = computed({
  get: () => queryParam('category'),
  set: (value: string | number) => setParam('category', value),
});

const kind = computed({
  get: () => queryParam('kind'),
  set: (value: string | number) => setParam('kind', value),
});

const from = computed({
  get: () => queryParam('from'),
  set: (value: string) => setParam('from', value),
});

const to = computed({
  get: () => queryParam('to'),
  set: (value: string) => setParam('to', value),
});

const offset = computed(() => {
  const raw = Number(queryParam('offset'));
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
});

const rangeError = computed(() => {
  if (!from.value && !to.value) return null;
  if (from.value && !DateTime.fromISO(from.value).isValid) return 'Informe datas válidas.';
  if (to.value && !DateTime.fromISO(to.value).isValid) return 'Informe datas válidas.';
  if (from.value && to.value && to.value < from.value) {
    return 'A data final deve ser depois da inicial.';
  }
  return null;
});

/** The date range bounds `paidAt`, so it can only ever narrow to paid rows. */
const rangeHint = computed(() =>
  from.value || to.value ? 'O período filtra a data de pagamento.' : null,
);

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'expenses',
        {
          status: status.value,
          category: category.value,
          kind: kind.value,
          from: from.value,
          to: to.value,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listExpenses({
      ...statusFilterToQuery(status.value),
      category: (category.value as ExpenseCategory) || undefined,
      kind: (kind.value as ExpenseKind) || undefined,
      from: from.value ? shopDayStartUtcIso(from.value) : undefined,
      to: to.value ? shopDayEndUtcIso(to.value) : undefined,
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
    query: { ...route.query, offset: next > 0 ? String(next) : undefined },
  });
}

function formatDueDate(value: string | null): string {
  if (!value) return '—';
  const date = DateTime.fromISO(value);
  return date.isValid ? date.toFormat('dd/MM/yyyy') : value;
}
</script>

<template>
  <PageLayout
    title="Despesas"
    subtitle="Custos fixos e variáveis. Uma despesa paga vira histórico financeiro."
  >
    <template #header-actions>
      <RouterLink to="/expenses/new">
        <BButton color="neutral" variant="contain">Nova despesa</BButton>
      </RouterLink>
    </template>

    <BCard class="expenses__filters">
      <div class="expenses__filters-row">
        <BSelect v-model="status" label="Situação" :options="EXPENSE_STATUS_FILTER_OPTIONS" />
        <BSelect v-model="category" label="Categoria" :options="EXPENSE_CATEGORY_FILTER_OPTIONS" />
        <BSelect v-model="kind" label="Tipo" :options="EXPENSE_KIND_FILTER_OPTIONS" />
        <label class="expenses__field">
          <span>Pago de</span>
          <input v-model="from" type="date" class="expenses__date" />
        </label>
        <label class="expenses__field">
          <span>Pago até</span>
          <input v-model="to" type="date" class="expenses__date" />
        </label>
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="expenses__error">
        {{ rangeError }}
      </BText>
      <BText
        v-else-if="rangeHint"
        as="p"
        variant="body-3"
        color="b-fg-neutral-secondary"
        class="expenses__hint"
      >
        {{ rangeHint }}
      </BText>
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
      title="Nenhuma despesa"
      subtitle="Não há despesas neste filtro."
    >
      <template #actions>
        <RouterLink to="/expenses/new">
          <BButton color="neutral" variant="contain">Nova despesa</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <template v-else>
      <BCard padding="0" class="expenses__table-card">
        <div class="expenses__table-wrap">
          <table class="expenses__table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td>
                  <div class="expenses__description">
                    <span>{{ row.description }}</span>
                    <BLabel v-if="row.recurring" color="grayLight">Recorrente</BLabel>
                  </div>
                </td>
                <td>{{ EXPENSE_CATEGORY_LABELS[row.category] }}</td>
                <td>{{ EXPENSE_KIND_LABELS[row.kind] }}</td>
                <td>{{ formatMoney(row.amountCents) }}</td>
                <td>{{ formatDueDate(row.dueDate) }}</td>
                <td>
                  <div class="expenses__status">
                    <BLabel v-if="row.paidAt" color="success">
                      Paga
                      <template v-if="row.paymentMethod">
                        · {{ PAYMENT_METHOD_LABELS[row.paymentMethod] }}
                      </template>
                    </BLabel>
                    <BLabel v-else-if="row.overdue" color="danger">Vencida</BLabel>
                    <BLabel v-else color="warning">Pendente</BLabel>
                    <BText
                      v-if="row.paidAt"
                      as="span"
                      variant="body-3"
                      color="b-fg-neutral-secondary"
                    >
                      {{ formatShopDateTime(row.paidAt, 'dd/MM/yyyy') }}
                    </BText>
                  </div>
                </td>
                <td class="expenses__actions">
                  <RouterLink :to="`/expenses/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="expenses__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="expenses__pager-actions">
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
.expenses__filters {
  margin-bottom: 1rem;
}

.expenses__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .expenses__filters-row {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: end;
  }
}

.expenses__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.expenses__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-border-neutral-primary, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-primary, #fff);
  color: inherit;
  font: inherit;
}

.expenses__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-primary, #b42318);
}

.expenses__hint {
  margin-top: 0.75rem;
}

.expenses__table-card {
  overflow: hidden;
}

.expenses__table-wrap {
  overflow-x: auto;
}

.expenses__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.expenses__table th,
.expenses__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.expenses__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.expenses__description {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.expenses__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.expenses__actions {
  text-align: right;
}

.expenses__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.expenses__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
