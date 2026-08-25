<script setup lang="ts">
import {
  BButton,
  BCard,
  BDialog,
  BEmptyState,
  BInputArea,
  BLabel,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { getProductSale, saleTotalCents, voidProductSale } from '@/api/product-sales';
import { listProducts } from '@/api/products';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { usePermission } from '@/composables/usePermission';
import { fieldErrorsFromZod, voidSaleSchema } from '@/features/products/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime, isSameShopDay } from '@/lib/shop-time';
import { useCashRegisterStore } from '@/stores/cash-register';

const route = useRoute();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();
const { hasRole } = usePermission();
const { barberName } = useBarberNames();

const id = computed(() => String(route.params.id));
const isAdmin = computed(() => hasRole('ADMIN'));

onMounted(() => {
  void cash.refresh();
});

const saleQuery = useQuery({
  queryKey: computed(() => ['product-sales', id.value] as const),
  queryFn: () => getProductSale(id.value),
});

const { isPending: salePending, isError: saleFailed } = saleQuery;

const productsQuery = useQuery({
  queryKey: ['products', { includeInactive: true }] as const,
  queryFn: () => listProducts({ includeInactive: true, limit: 100 }),
});

const lines = computed(() => saleQuery.data.value ?? []);
const firstLine = computed(() => lines.value[0] ?? null);
const totalCents = computed(() => saleTotalCents(lines.value));
const isVoided = computed(() => Boolean(firstLine.value?.voidedAt));

function productName(productId: string): string {
  const found = (productsQuery.data.value?.data ?? []).find(
    (product) => product.id === productId,
  );
  return found?.name ?? `${productId.slice(0, 8)}…`;
}

/** Same-day only, matching the void on the payment underneath it. */
const canVoid = computed(() => {
  const line = firstLine.value;
  if (!isAdmin.value || !line || line.voidedAt) return false;
  return isSameShopDay(line.createdAt);
});

const voidBlockedReason = computed(() => {
  const line = firstLine.value;
  if (!isAdmin.value || !line || line.voidedAt) return null;
  if (!isSameShopDay(line.createdAt)) return 'Estorno só no mesmo dia.';
  return null;
});

const voidOpen = ref(false);
const voidForm = reactive({ reason: '' });
const voidErrors = ref<Record<string, string>>({});
const voidPending = ref(false);

function openVoid(): void {
  voidForm.reason = '';
  voidErrors.value = {};
  voidOpen.value = true;
}

async function submitVoid(): Promise<void> {
  voidErrors.value = {};
  const parsed = voidSaleSchema.safeParse(voidForm);
  if (!parsed.success) {
    voidErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  voidPending.value = true;
  try {
    await voidProductSale(id.value, parsed.data.reason || undefined);
    toast.add({ message: 'Venda estornada.', severity: 'success' });
    voidOpen.value = false;
    await queryClient.invalidateQueries({ queryKey: ['product-sales'] });
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    await queryClient.invalidateQueries({ queryKey: ['payments'] });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await queryClient.invalidateQueries({ queryKey: ['commission-entries'] });
    await cash.refresh();
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Não foi possível estornar.',
      severity: 'failure',
    });
  } finally {
    voidPending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Uma cesta é estornada inteira: as linhas dividem um pagamento, e um pagamento não se estorna pela metade.">
    <template #title>
      <div class="sale__title">
        <PageBackLink to="/product-sales" label="Vendas" />
        <BText as="h1" variant="heading-1">Venda</BText>
      </div>
    </template>

    <template v-if="canVoid" #header-actions>
      <BButton color="danger" variant="outline" @click="openVoid">Estornar</BButton>
    </template>

    <BSkeletonLoader v-if="salePending" height="260px" />

    <BEmptyState
      v-else-if="saleFailed || !firstLine"
      title="Venda não encontrada"
      subtitle="Confira o link e tente de novo."
    />

    <template v-else>
      <BCard v-if="isVoided" class="sale__notice">
        <BText as="p" variant="body-2">
          Venda estornada em {{ formatShopDateTime(firstLine.voidedAt!) }}. O estoque voltou para a
          prateleira e o pagamento foi desfeito.
          <template v-if="firstLine.voidReason"> Motivo: {{ firstLine.voidReason }}.</template>
        </BText>
      </BCard>

      <SectionCard title="Resumo">
        <dl class="sale__summary">
          <div>
            <dt>Total</dt>
            <dd>{{ formatMoney(totalCents) }}</dd>
          </div>
          <div>
            <dt>Quando</dt>
            <dd>{{ formatShopDateTime(firstLine.createdAt) }}</dd>
          </div>
          <div>
            <dt>Vendedor</dt>
            <dd>
              {{ firstLine.soldByBarberId ? barberName(firstLine.soldByBarberId) : 'Venda da casa' }}
            </dd>
          </div>
          <div>
            <dt>Cliente</dt>
            <dd>
              <RouterLink
                v-if="firstLine.clientId"
                :to="`/clients/${firstLine.clientId}`"
                class="sale__link"
              >
                Ver ficha
              </RouterLink>
              <span v-else>—</span>
            </dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <BLabel v-if="isVoided" color="grayLight">Estornada</BLabel>
              <BLabel v-else color="success">Ativa</BLabel>
            </dd>
          </div>
        </dl>
        <BText
          v-if="voidBlockedReason"
          as="p"
          variant="body-3"
          color="b-fg-neutral-secondary"
          class="sale__note"
        >
          {{ voidBlockedReason }}
        </BText>
      </SectionCard>

      <SectionCard title="Itens" class="sale__items">
        <div class="sale__table-wrap">
          <table class="sale__table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in lines" :key="line.id">
                <td>{{ productName(line.productId) }}</td>
                <td>{{ line.quantity }}</td>
                <td>{{ formatMoney(line.unitPriceCents) }}</td>
                <td>{{ formatMoney(line.totalCents) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Total</td>
                <td>{{ formatMoney(totalCents) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>
    </template>

    <BDialog
      :is-open="voidOpen"
      title-text="Estornar a venda inteira?"
      width="460px"
      @update:is-open="(open: boolean) => (voidOpen = open)"
    >
      <p>
        As unidades voltam para o estoque, o pagamento é estornado e a comissão do vendedor é
        zerada. Se o período de comissão já tiver fechado, o estorno é recusado.
      </p>
      <BInputArea
        v-model="voidForm.reason"
        label="Motivo"
        rows="3"
        :helper-text="voidErrors.reason"
      />
      <template #footer>
        <BButton variant="outline" color="neutral" @click="voidOpen = false">Fechar</BButton>
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
.sale__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sale__notice {
  margin-bottom: 1rem;
  border-left: 3px solid var(--b-fg-neutral-secondary, #667085);
}

.sale__summary {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  margin: 0;
}

@media (min-width: 700px) {
  .sale__summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.sale__summary dt {
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
  margin-bottom: 0.15rem;
}

.sale__summary dd {
  margin: 0;
  font-size: 0.9375rem;
}

.sale__note {
  margin-top: 0.75rem;
}

.sale__link {
  color: var(--b-fg-primary-default, #2563eb);
  text-decoration: underline;
}

.sale__items {
  margin-top: 1rem;
}

.sale__table-wrap {
  overflow-x: auto;
}

.sale__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.sale__table th,
.sale__table td {
  padding: 0.65rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
  vertical-align: middle;
}

.sale__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.sale__table tfoot td {
  font-weight: 600;
  border-bottom: none;
}
</style>
