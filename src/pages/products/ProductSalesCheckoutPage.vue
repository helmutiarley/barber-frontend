<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BInput,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { listClients } from '@/api/clients';
import { sellProducts } from '@/api/product-sales';
import { listProducts } from '@/api/products';
import type { PaymentMethod } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useBarberNames } from '@/composables/useBarberNames';
import { PAYMENT_METHOD_FORM_OPTIONS } from '@/features/payments/method-labels';
import {
  basketProblems as computeBasketProblems,
  basketTotalCents,
  type BasketLine,
} from '@/features/products/basket';
import { fieldErrorsFromZod, sellProductsSchema } from '@/features/products/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { useCashRegisterStore } from '@/stores/cash-register';

const MAX_LINES = 50;

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();
const { barberOptions } = useBarberNames();

onMounted(() => {
  void cash.refresh();
});

const productsQuery = useQuery({
  queryKey: ['products', { forSale: true }] as const,
  queryFn: () => listProducts({ limit: 100 }),
});

const { isPending: productsPending, isError: productsFailed } = productsQuery;

const clientsQuery = useQuery({
  queryKey: ['clients', { forSale: true }] as const,
  queryFn: () => listClients({ limit: 100 }),
});

const products = computed(() => productsQuery.data.value?.data ?? []);

const productOptions = computed(() => [
  { label: 'Escolha o produto', value: '' },
  ...products.value.map((product) => ({
    label: `${product.name} — ${formatMoney(product.priceCents)} (${product.stockQuantity} un.)`,
    value: product.id,
  })),
]);

const sellerOptions = computed(() => [
  { label: 'Venda da casa', value: '' },
  ...barberOptions.value,
]);

const clientOptions = computed(() => [
  { label: 'Sem cliente', value: '' },
  ...(clientsQuery.data.value?.data ?? []).map((client) => ({
    label: client.name,
    value: client.id,
  })),
]);

const lines = ref<BasketLine[]>([{ productId: '', quantity: 1 }]);
const form = reactive({
  method: 'cash' as string,
  soldByBarberId: '',
  clientId: '',
});

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

function lineTotalCents(line: BasketLine): number {
  return basketTotalCents([line], products.value);
}

const totalCents = computed(() => basketTotalCents(lines.value, products.value));

const basketProblems = computed(() => computeBasketProblems(lines.value, products.value));

const cashBlocked = computed(() => form.method === 'cash' && cash.status === 'closed');

function addLine(): void {
  if (lines.value.length >= MAX_LINES) return;
  lines.value.push({ productId: '', quantity: 1 });
}

function removeLine(index: number): void {
  if (lines.value.length <= 1) return;
  lines.value.splice(index, 1);
}

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  if (cashBlocked.value) {
    formError.value = 'Abra o caixa para receber em dinheiro.';
    return;
  }

  if (basketProblems.value.length > 0) {
    formError.value = 'Ajuste a cesta antes de finalizar.';
    return;
  }

  const parsed = sellProductsSchema.safeParse({ items: lines.value, ...form });
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'items' && typeof issue.path[1] === 'number') {
        const key = `items.${issue.path[1]}.${String(issue.path[2] ?? 'quantity')}`;
        if (!fieldErrors.value[key]) fieldErrors.value[key] = issue.message;
      }
    }
    return;
  }

  pending.value = true;
  try {
    const sale = await sellProducts({
      items: parsed.data.items,
      method: parsed.data.method as PaymentMethod,
      soldByBarberId: parsed.data.soldByBarberId || null,
      clientId: parsed.data.clientId || null,
    });
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    await queryClient.invalidateQueries({ queryKey: ['product-sales'] });
    await queryClient.invalidateQueries({ queryKey: ['payments'] });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await queryClient.invalidateQueries({ queryKey: ['commission-entries'] });
    await cash.refresh();

    // A seller with no `products` rule still sells; the sale just earns nothing,
    // and saying so beats letting them find out at the next closing.
    const soldByBarber = Boolean(parsed.data.soldByBarberId);
    const earned = sale.commissionEntryIds.length > 0;
    toast.add({
      message:
        soldByBarber && !earned
          ? 'Venda registrada. Sem regra de comissão para produtos, nada foi creditado.'
          : 'Venda registrada.',
      severity: soldByBarber && !earned ? 'warning' : 'success',
    });

    const firstLine = sale.lines[0];
    await router.push(firstLine ? `/product-sales/${firstLine.id}` : '/product-sales');
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível vender.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Uma cesta, uma forma de pagamento. É isso que deixa o estorno sem ambiguidade.">
    <template #title>
      <div class="pos__title">
        <PageBackLink to="/product-sales" label="Vendas" />
        <BText as="h1" variant="heading-1">Nova venda</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="productsPending" height="240px" />

    <BEmptyState
      v-else-if="productsFailed"
      title="Não foi possível carregar o catálogo"
      subtitle="Tente novamente em instantes."
    />

    <BEmptyState
      v-else-if="products.length === 0"
      title="Nenhum produto ativo"
      subtitle="Cadastre um produto antes de vender."
    />

    <form v-else @submit.prevent="onSubmit">
      <SectionCard title="Cesta">
        <div class="pos__lines">
          <div v-for="(line, index) in lines" :key="index" class="pos__line">
            <BSelect
              v-model="line.productId"
              label="Produto"
              :options="productOptions"
              :helper-text="fieldErrors[`items.${index}.productId`]"
            />
            <BInput
              v-model="line.quantity"
              label="Qtd."
              type="number"
              :helper-text="fieldErrors[`items.${index}.quantity`]"
            />
            <div class="pos__line-total">
              <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Subtotal</BText>
              <BText as="span" variant="body-2">{{ formatMoney(lineTotalCents(line)) }}</BText>
            </div>
            <BButton
              size="small"
              variant="outline"
              color="neutral"
              :is-disabled="lines.length <= 1"
              @click="removeLine(index)"
            >
              Remover
            </BButton>
          </div>
        </div>

        <BButton
          size="small"
          variant="outline"
          color="neutral"
          :is-disabled="lines.length >= MAX_LINES"
          @click="addLine"
        >
          Adicionar item
        </BButton>

        <BText v-if="fieldErrors.items" as="p" variant="body-3" class="pos__error">
          {{ fieldErrors.items }}
        </BText>

        <ul v-if="basketProblems.length > 0" class="pos__problems">
          <li v-for="problem in basketProblems" :key="problem">{{ problem }}</li>
        </ul>
      </SectionCard>

      <SectionCard title="Pagamento e crédito" class="pos__payment">
        <div class="pos__row">
          <BSelect
            v-model="form.method"
            label="Forma"
            :options="PAYMENT_METHOD_FORM_OPTIONS"
            :helper-text="fieldErrors.method"
          />
          <BSelect
            v-model="form.soldByBarberId"
            label="Vendido por"
            :options="sellerOptions"
            :helper-text="fieldErrors.soldByBarberId"
          />
          <BSelect
            v-model="form.clientId"
            label="Cliente"
            :options="clientOptions"
            :helper-text="fieldErrors.clientId"
          />
        </div>

        <BText v-if="cashBlocked" as="p" variant="body-3" class="pos__error">
          Abra o caixa para receber em dinheiro.
        </BText>
      </SectionCard>

      <BCard class="pos__summary">
        <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Total</BText>
        <BText as="span" variant="heading-1">{{ formatMoney(totalCents) }}</BText>
      </BCard>

      <BText v-if="formError" as="p" variant="body-2" class="pos__error">
        {{ formError }}
      </BText>

      <div class="pos__actions">
        <BButton
          type="submit"
          color="neutral"
          variant="contain"
          :is-loading="pending"
          :is-disabled="totalCents === 0 || basketProblems.length > 0 || cashBlocked"
        >
          Finalizar venda
        </BButton>
        <BButton variant="outline" color="neutral" @click="router.push('/product-sales')">
          Cancelar
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.pos__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pos__lines {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.pos__line {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr;
  align-items: end;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--b-border-neutral-secondary, #eaecf0);
}

@media (min-width: 700px) {
  .pos__line {
    grid-template-columns: 3fr 1fr 1fr auto;
  }
}

.pos__line-total {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pos__problems {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
  color: var(--b-fg-danger-primary, #b42318);
  font-size: 0.8125rem;
}

.pos__payment {
  margin-top: 1rem;
}

.pos__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .pos__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}

.pos__summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 1rem;
}

.pos__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-primary, #b42318);
}

.pos__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
