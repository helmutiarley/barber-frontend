<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BInput,
  BInputArea,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { adjustStock, getProduct, listStockAdjustments } from '@/api/products';
import type { StockAdjustmentReason } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  defaultSignFor,
  STOCK_REASON_FORM_OPTIONS,
  STOCK_REASON_HINTS,
  STOCK_REASON_LABELS,
} from '@/features/products/labels';
import {
  adjustStockSchema,
  fieldErrorsFromZod,
  signedDelta,
} from '@/features/products/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatShopDateTime } from '@/lib/shop-time';

const PAGE_SIZE = 50;

const route = useRoute();
const toast = useBToast();
const queryClient = useQueryClient();

const id = computed(() => String(route.params.id));

const productQuery = useQuery({
  queryKey: computed(() => ['products', id.value] as const),
  queryFn: () => getProduct(id.value),
});

const { isPending: productPending, isError: productFailed } = productQuery;

const historyQuery = useQuery({
  queryKey: computed(() => ['products', id.value, 'stock-adjustments'] as const),
  queryFn: () => listStockAdjustments(id.value, { limit: PAGE_SIZE }),
});

const { isPending: historyPending } = historyQuery;

const product = computed(() => productQuery.data.value ?? null);
const history = computed(() => historyQuery.data.value?.data ?? []);

const DIRECTION_OPTIONS = [
  { label: 'Entrada (+)', value: 'in' },
  { label: 'Saída (−)', value: 'out' },
];

const form = reactive({
  reason: 'purchase' as string,
  direction: 'in' as string,
  quantity: 1 as number | string,
  notes: '',
});

// Receiving stock adds; a loss or a recount almost always takes away.
watch(
  () => form.reason,
  (reason) => {
    form.direction = defaultSignFor(reason as StockAdjustmentReason) === 1 ? 'in' : 'out';
  },
);

const reasonHint = computed(
  () => STOCK_REASON_HINTS[form.reason as StockAdjustmentReason] ?? '',
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

const previewQuantity = computed(() => {
  const current = product.value?.stockQuantity ?? 0;
  const parsed = Number(form.quantity);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return current + signedDelta(form.direction as 'in' | 'out', Math.trunc(parsed));
});

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = adjustStockSchema.safeParse({
    ...form,
    stockQuantity: product.value?.stockQuantity ?? 0,
  });
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await adjustStock(id.value, {
      delta: signedDelta(parsed.data.direction, parsed.data.quantity),
      reason: parsed.data.reason,
      notes: parsed.data.notes === '' ? null : parsed.data.notes,
    });
    toast.add({ message: 'Estoque ajustado.', severity: 'success' });
    form.quantity = 1;
    form.notes = '';
    await queryClient.invalidateQueries({ queryKey: ['products'] });
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível ajustar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Toda unidade que entra ou sai da prateleira tem um motivo escrito.">
    <template #title>
      <div class="stock__title">
        <PageBackLink :to="`/products/${id}`" label="Produto" />
        <BText as="h1" variant="heading-1">
          Estoque · {{ product?.name ?? '' }}
        </BText>
      </div>
    </template>

    <BSkeletonLoader v-if="productPending" height="240px" />

    <BEmptyState
      v-else-if="productFailed || !product"
      title="Produto não encontrado"
      subtitle="Ele pode ter sido removido."
    />

    <template v-else>
      <BCard class="stock__current">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Na prateleira</BText>
        <div class="stock__current-value">
          <BText as="span" variant="heading-1">{{ product.stockQuantity }}</BText>
          <BLabel v-if="product.lowStock" color="warning">Estoque baixo</BLabel>
        </div>
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
          Alerta em {{ product.lowStockThreshold }} unidade(s).
        </BText>
      </BCard>

      <form @submit.prevent="onSubmit">
        <SectionCard title="Novo ajuste" :subtitle="reasonHint">
          <div class="stock__fields">
            <div class="stock__row">
              <BSelect
                v-model="form.reason"
                label="Motivo"
                :options="STOCK_REASON_FORM_OPTIONS"
                :helper-text="fieldErrors.reason"
              />
              <BSelect
                v-model="form.direction"
                label="Direção"
                :options="DIRECTION_OPTIONS"
                :helper-text="fieldErrors.direction"
              />
              <BInput
                v-model="form.quantity"
                label="Quantidade"
                type="number"
                label-prepend-asterisk
                :helper-text="fieldErrors.quantity"
              />
            </div>
            <BInputArea
              v-model="form.notes"
              label="Observação"
              rows="2"
              :helper-text="fieldErrors.notes"
            />
          </div>

          <BText
            v-if="previewQuantity !== null"
            as="p"
            variant="body-3"
            color="b-fg-neutral-secondary"
            class="stock__preview"
          >
            A prateleira fica com {{ previewQuantity }} unidade(s).
          </BText>

          <BText v-if="formError" as="p" variant="body-2" class="stock__error">
            {{ formError }}
          </BText>

          <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
            Registrar ajuste
          </BButton>
        </SectionCard>
      </form>

      <SectionCard title="Histórico" class="stock__history">
        <BSkeletonLoader v-if="historyPending" height="120px" />
        <BEmptyState
          v-else-if="history.length === 0"
          title="Sem ajustes"
          subtitle="Vendas movem o estoque sem passar por aqui — elas têm a própria trilha."
        />
        <div v-else class="stock__table-wrap">
          <table class="stock__table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Motivo</th>
                <th>Delta</th>
                <th>Ficou com</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in history" :key="row.id">
                <td>{{ formatShopDateTime(row.createdAt) }}</td>
                <td>{{ STOCK_REASON_LABELS[row.reason] }}</td>
                <td :class="row.delta > 0 ? 'stock__in' : 'stock__out'">
                  {{ row.delta > 0 ? '+' : '' }}{{ row.delta }}
                </td>
                <td>{{ row.resultingQuantity }}</td>
                <td>{{ row.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.stock__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stock__current {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.stock__current-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stock__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stock__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .stock__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}

.stock__preview {
  margin-bottom: 0.75rem;
}

.stock__error {
  color: var(--b-fg-danger-hover, #b42318);
  margin-bottom: 0.75rem;
}

.stock__history {
  margin-top: 1rem;
}

.stock__table-wrap {
  overflow-x: auto;
}

.stock__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.stock__table th,
.stock__table td {
  padding: 0.65rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.stock__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.stock__in {
  color: var(--b-fg-success-hover, #067647);
}

.stock__out {
  color: var(--b-fg-danger-hover, #b42318);
}
</style>
