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
import { listProductSales } from '@/api/product-sales';
import { listProducts } from '@/api/products';
import PageLayout from '@/components/layout/PageLayout.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { SALE_STATUS_FILTER_OPTIONS } from '@/features/products/labels';
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
const { barberName, barberFilterOptions } = useBarberNames();

function defaultFrom(): string {
  return DateTime.fromISO(shopToday()).minus({ days: 7 }).toISODate()!;
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

const productId = computed({
  get: () => (typeof route.query.productId === 'string' ? route.query.productId : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, productId: value ? String(value) : undefined, offset: undefined },
    });
  },
});

const voided = computed({
  get: () => (typeof route.query.voided === 'string' ? route.query.voided : ''),
  set: (value: string | number) => {
    void router.replace({
      query: { ...route.query, voided: value ? String(value) : undefined, offset: undefined },
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

const productsQuery = useQuery({
  queryKey: ['products', { includeInactive: true }] as const,
  queryFn: () => listProducts({ includeInactive: true, limit: 100 }),
});

const productOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...(productsQuery.data.value?.data ?? []).map((product) => ({
    label: product.name,
    value: product.id,
  })),
]);

function productName(id: string): string {
  const found = (productsQuery.data.value?.data ?? []).find((product) => product.id === id);
  return found?.name ?? `${id.slice(0, 8)}…`;
}

const listQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'product-sales',
        {
          from: from.value,
          to: to.value,
          barberId: barberId.value || undefined,
          productId: productId.value || undefined,
          voided: voided.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listProductSales({
      from: shopDayStartUtcIso(from.value),
      to: shopDayEndUtcIso(to.value),
      barberId: barberId.value || undefined,
      productId: productId.value || undefined,
      voided: voided.value === '' ? undefined : voided.value === 'true',
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

const activeTotalCents = computed(() =>
  rows.value.filter((line) => !line.voidedAt).reduce((sum, line) => sum + line.totalCents, 0),
);

function setOffset(next: number): void {
  void router.replace({
    query: { ...route.query, offset: next > 0 ? String(next) : undefined },
  });
}
</script>

<template>
  <PageLayout
    title="Vendas"
    subtitle="Cada linha é um item; as linhas de uma mesma cesta dividem o pagamento."
  >
    <template #header-actions>
      <RouterLink to="/product-sales/new">
        <BButton color="neutral" variant="contain">Nova venda</BButton>
      </RouterLink>
    </template>

    <BCard class="sales__filters">
      <div class="sales__filters-row">
        <label class="sales__field">
          <span>De</span>
          <input v-model="from" type="date" class="sales__date" />
        </label>
        <label class="sales__field">
          <span>Até</span>
          <input v-model="to" type="date" class="sales__date" />
        </label>
        <BSelect v-model="productId" label="Produto" :options="productOptions" />
        <BSelect v-model="barberId" label="Vendedor" :options="barberFilterOptions" />
        <BSelect v-model="voided" label="Situação" :options="SALE_STATUS_FILTER_OPTIONS" />
      </div>
      <BText v-if="rangeError" as="p" variant="body-3" class="sales__error">
        {{ rangeError }}
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
      title="Nenhuma venda"
      subtitle="Não há vendas neste filtro."
    >
      <template #actions>
        <RouterLink to="/product-sales/new">
          <BButton color="neutral" variant="contain">Nova venda</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <template v-else>
      <BCard padding="0" class="sales__table-card">
        <div class="sales__table-wrap">
          <table class="sales__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Unitário</th>
                <th>Total</th>
                <th>Vendedor</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.id"
                :class="{ 'sales__row--voided': row.voidedAt }"
              >
                <td>{{ formatShopDateTime(row.createdAt) }}</td>
                <td>{{ productName(row.productId) }}</td>
                <td>{{ row.quantity }}</td>
                <td>{{ formatMoney(row.unitPriceCents) }}</td>
                <td>{{ formatMoney(row.totalCents) }}</td>
                <td>{{ row.soldByBarberId ? barberName(row.soldByBarberId) : 'Casa' }}</td>
                <td>
                  <BLabel v-if="row.voidedAt" color="grayLight">Estornada</BLabel>
                  <BLabel v-else color="success">Ativa</BLabel>
                </td>
                <td class="sales__actions">
                  <RouterLink :to="`/product-sales/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Cesta</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="sales__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }} · ativas nesta
          página {{ formatMoney(activeTotalCents) }}
        </BText>
        <div class="sales__pager-actions">
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
.sales__filters {
  margin-bottom: 1rem;
}

.sales__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .sales__filters-row {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: end;
  }
}

.sales__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.sales__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-stroke-neutral-mid, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-default, #fff);
  color: inherit;
  font: inherit;
}

.sales__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-hover, #b42318);
}

.sales__table-card {
  overflow: hidden;
}

.sales__table-wrap {
  overflow-x: auto;
}

.sales__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.sales__table th,
.sales__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.sales__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.sales__row--voided {
  opacity: 0.65;
}

.sales__actions {
  text-align: right;
}

.sales__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.sales__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
