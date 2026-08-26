<script setup lang="ts">
import {
  BButton,
  BCard,
  BDialog,
  BEmptyState,
  BInput,
  BInputArea,
  BLabel,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { deactivateProduct, getProduct, updateProduct } from '@/api/products';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { usePermission } from '@/composables/usePermission';
import {
  centsToMoneyInput,
  fieldErrorsFromZod,
  updateProductSchema,
} from '@/features/products/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const { hasRole } = usePermission();

const id = computed(() => String(route.params.id));
const isAdmin = computed(() => hasRole('ADMIN'));

const productQuery = useQuery({
  queryKey: computed(() => ['products', id.value] as const),
  queryFn: () => getProduct(id.value),
});

const { isPending: productPending, isError: productFailed } = productQuery;

const product = computed(() => productQuery.data.value ?? null);

const form = reactive({
  name: '',
  description: '',
  priceText: '',
  costText: '',
  lowStockThreshold: 0 as number | string,
});

watch(
  product,
  (next) => {
    if (!next) return;
    form.name = next.name;
    form.description = next.description ?? '';
    form.priceText = centsToMoneyInput(next.priceCents);
    form.costText = next.costCents === null ? '' : centsToMoneyInput(next.costCents);
    form.lowStockThreshold = next.lowStockThreshold;
  },
  { immediate: true },
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = updateProductSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await updateProduct(id.value, {
      name: parsed.data.name,
      description: parsed.data.description === '' ? null : parsed.data.description,
      priceCents: parsed.data.priceText,
      costCents: parsed.data.costText,
      lowStockThreshold: parsed.data.lowStockThreshold,
    });
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.add({ message: 'Produto atualizado.', severity: 'success' });
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}

const deactivateOpen = ref(false);
const deactivating = ref(false);

async function confirmDeactivate(): Promise<void> {
  deactivating.value = true;
  try {
    await deactivateProduct(id.value);
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.add({ message: 'Produto desativado.', severity: 'success' });
    await router.push('/products');
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Não foi possível desativar.',
      severity: 'failure',
    });
  } finally {
    deactivating.value = false;
    deactivateOpen.value = false;
  }
}
</script>

<template>
  <PageLayout>
    <template #title>
      <div class="product__title">
        <PageBackLink to="/products" label="Produtos" />
        <BText as="h1" variant="heading-1">{{ product?.name ?? 'Produto' }}</BText>
      </div>
    </template>

    <template v-if="product" #header-actions>
      <RouterLink :to="`/products/${id}/stock`">
        <BButton variant="outline" color="neutral">Estoque</BButton>
      </RouterLink>
      <BButton
        v-if="isAdmin && product.active"
        color="danger"
        variant="outline"
        @click="deactivateOpen = true"
      >
        Desativar
      </BButton>
    </template>

    <BSkeletonLoader v-if="productPending" height="280px" />

    <BEmptyState
      v-else-if="productFailed || !product"
      title="Produto não encontrado"
      subtitle="Ele pode ter sido removido."
    />

    <template v-else>
      <BCard v-if="!product.active" class="product__notice">
        <BText as="p" variant="body-2">
          Produto inativo. Ele não aparece no balcão, mas ainda aceita ajustes de estoque — é assim
          que se zera o que sobrou na prateleira.
        </BText>
      </BCard>

      <div class="product__stats">
        <BCard class="product__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Preço</BText>
          <BText as="span" variant="heading-2">{{ formatMoney(product.priceCents) }}</BText>
        </BCard>
        <BCard class="product__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Custo</BText>
          <BText as="span" variant="heading-2">
            {{ product.costCents === null ? '—' : formatMoney(product.costCents) }}
          </BText>
        </BCard>
        <BCard class="product__stat">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Estoque</BText>
          <div class="product__stock">
            <BText as="span" variant="heading-2">{{ product.stockQuantity }}</BText>
            <BLabel v-if="product.lowStock" color="warning">Baixo</BLabel>
          </div>
        </BCard>
      </div>

      <form @submit.prevent="onSubmit">
        <SectionCard
          title="Editar"
          subtitle="O estoque não está aqui: ele só muda por ajuste ou venda, para toda unidade ter um motivo."
        >
          <div class="product__fields">
            <BInput
              v-model="form.name"
              label="Nome"
              label-prepend-asterisk
              :is-disabled="!isAdmin"
              :helper-text="fieldErrors.name"
            />
            <BInputArea
              v-model="form.description"
              label="Descrição"
              rows="2"
              :is-disabled="!isAdmin"
              :helper-text="fieldErrors.description"
            />
            <div class="product__row">
              <BInput
                v-model="form.priceText"
                label="Preço de venda"
                label-prepend-asterisk
                :is-disabled="!isAdmin"
                :helper-text="fieldErrors.priceText"
              />
              <BInput
                v-model="form.costText"
                label="Custo"
                :is-disabled="!isAdmin"
                :helper-text="fieldErrors.costText"
              />
              <BInput
                v-model="form.lowStockThreshold"
                label="Alerta de estoque baixo"
                type="number"
                :is-disabled="!isAdmin"
                :helper-text="fieldErrors.lowStockThreshold"
              />
            </div>
          </div>

          <BText v-if="formError" as="p" variant="body-2" class="product__error">
            {{ formError }}
          </BText>

          <BButton
            v-if="isAdmin"
            type="submit"
            color="neutral"
            variant="contain"
            :is-loading="pending"
          >
            Salvar
          </BButton>
          <BText v-else as="p" variant="body-3" color="b-fg-neutral-secondary">
            Só um administrador altera preço e cadastro.
          </BText>
        </SectionCard>
      </form>
    </template>

    <BDialog
      :is-open="deactivateOpen"
      title-text="Desativar produto?"
      width="420px"
      @update:is-open="(open: boolean) => (deactivateOpen = open)"
    >
      <p>
        Ele sai do balcão e do catálogo ativo. As vendas passadas continuam intactas, e o nome fica
        livre para um produto novo.
      </p>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="deactivateOpen = false">
          Cancelar
        </BButton>
        <BButton
          color="danger"
          variant="contain"
          :is-loading="deactivating"
          @click="confirmDeactivate"
        >
          Desativar
        </BButton>
      </template>
    </BDialog>
  </PageLayout>
</template>

<style scoped>
.product__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.product__notice {
  margin-bottom: 1rem;
  border-left: 3px solid var(--b-fg-neutral-secondary, #667085);
}

.product__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
  margin-bottom: 1rem;
}

@media (min-width: 700px) {
  .product__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.product__stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product__stock {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.product__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.product__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .product__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
}

.product__error {
  color: var(--b-fg-danger-hover, #b42318);
  margin-bottom: 0.75rem;
}
</style>
