<script setup lang="ts">
import {
  BButton,
  BCard,
  BCheckbox,
  BEmptyState,
  BInput,
  BLabel,
  BSkeletonLoader,
  BText,
} from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { listProducts } from '@/api/products';
import PageLayout from '@/components/layout/PageLayout.vue';
import { usePermission } from '@/composables/usePermission';
import { formatMoney } from '@/lib/money';

const PAGE_SIZE = 50;

const route = useRoute();
const router = useRouter();
const { hasRole } = usePermission();

const isAdmin = computed(() => hasRole('ADMIN'));
const canManage = computed(() => hasRole('ADMIN', 'MANAGER'));

const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '');
let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(searchInput, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    void router.replace({
      query: { ...route.query, search: value.trim() || undefined, offset: undefined },
    });
  }, 300);
});

const search = computed(() =>
  typeof route.query.search === 'string' ? route.query.search : '',
);

const lowStockOnly = computed({
  get: () => route.query.lowStock === 'true',
  set: (value: boolean) => {
    void router.replace({
      query: { ...route.query, lowStock: value ? 'true' : undefined, offset: undefined },
    });
  },
});

const includeInactive = computed({
  get: () => route.query.includeInactive === 'true',
  set: (value: boolean) => {
    void router.replace({
      query: { ...route.query, includeInactive: value ? 'true' : undefined, offset: undefined },
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
        'products',
        {
          search: search.value || undefined,
          lowStock: lowStockOnly.value || undefined,
          includeInactive: includeInactive.value || undefined,
          offset: offset.value,
        },
      ] as const,
  ),
  queryFn: () =>
    listProducts({
      search: search.value || undefined,
      lowStock: lowStockOnly.value || undefined,
      includeInactive: includeInactive.value || undefined,
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

/** Only meaningful when a cost is tracked; a product without one shows nothing. */
function margin(priceCents: number, costCents: number | null): string {
  if (costCents === null || costCents === 0) return '—';
  return `${Math.round(((priceCents - costCents) / priceCents) * 100)}%`;
}
</script>

<template>
  <PageLayout title="Produtos" subtitle="A prateleira da loja. Estoque só muda por ajuste ou venda.">
    <template #header-actions>
      <RouterLink v-if="canManage" to="/product-sales/new">
        <BButton variant="outline" color="neutral">Vender</BButton>
      </RouterLink>
      <RouterLink v-if="isAdmin" to="/products/new">
        <BButton color="neutral" variant="contain">Novo produto</BButton>
      </RouterLink>
    </template>

    <BCard class="products__filters">
      <div class="products__filters-row">
        <BInput v-model="searchInput" label="Buscar" placeholder="Nome do produto" />
        <BCheckbox v-model="lowStockOnly" label="Só estoque baixo" />
        <BCheckbox v-model="includeInactive" label="Incluir inativos" />
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
      title="Nenhum produto"
      subtitle="Cadastre o que a loja vende no balcão."
    >
      <template v-if="isAdmin" #actions>
        <RouterLink to="/products/new">
          <BButton color="neutral" variant="contain">Novo produto</BButton>
        </RouterLink>
      </template>
    </BEmptyState>

    <template v-else>
      <BCard padding="0" class="products__table-card">
        <div class="products__table-wrap">
          <table class="products__table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Custo</th>
                <th>Margem</th>
                <th>Estoque</th>
                <th v-if="canManage" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.id"
                :class="{ 'products__row--off': !row.active }"
              >
                <td>
                  <div class="products__name">
                    <span>{{ row.name }}</span>
                    <BLabel v-if="!row.active" color="grayLight">Inativo</BLabel>
                  </div>
                  <BText
                    v-if="row.description"
                    as="span"
                    variant="body-3"
                    color="b-fg-neutral-secondary"
                  >
                    {{ row.description }}
                  </BText>
                </td>
                <td>{{ formatMoney(row.priceCents) }}</td>
                <td>{{ row.costCents === null ? '—' : formatMoney(row.costCents) }}</td>
                <td>{{ margin(row.priceCents, row.costCents) }}</td>
                <td>
                  <div class="products__stock">
                    <span>{{ row.stockQuantity }}</span>
                    <BLabel v-if="row.lowStock" color="warning">Baixo</BLabel>
                  </div>
                </td>
                <td v-if="canManage" class="products__actions">
                  <RouterLink :to="`/products/${row.id}/stock`">
                    <BButton size="small" variant="outline" color="neutral">Estoque</BButton>
                  </RouterLink>
                  <RouterLink :to="`/products/${row.id}`">
                    <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BCard>

      <div class="products__pager">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          {{ offset + 1 }}–{{ Math.min(offset + PAGE_SIZE, total) }} de {{ total }}
        </BText>
        <div class="products__pager-actions">
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
.products__filters {
  margin-bottom: 1rem;
}

.products__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 900px) {
  .products__filters-row {
    grid-template-columns: 2fr 1fr 1fr;
    align-items: end;
  }
}

.products__table-card {
  overflow: hidden;
}

.products__table-wrap {
  overflow-x: auto;
}

.products__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.products__table th,
.products__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.products__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.products__row--off {
  opacity: 0.6;
}

.products__name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.products__stock {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.products__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.products__pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.products__pager-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
