<script setup lang="ts">
import { BButton, BInput, BInputArea, BText, useBToast } from '@barber/bcomponents';
import { useQueryClient } from '@tanstack/vue-query';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createProduct } from '@/api/products';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { createProductSchema, fieldErrorsFromZod } from '@/features/products/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const form = reactive({
  name: '',
  description: '',
  priceText: '',
  costText: '',
  stockQuantity: 0 as number | string,
  lowStockThreshold: 0 as number | string,
});

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = createProductSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const created = await createProduct({
      name: parsed.data.name,
      description: parsed.data.description === '' ? null : parsed.data.description,
      priceCents: parsed.data.priceText,
      costCents: parsed.data.costText,
      stockQuantity: parsed.data.stockQuantity,
      lowStockThreshold: parsed.data.lowStockThreshold,
    });
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.add({ message: 'Produto criado.', severity: 'success' });
    await router.push(`/products/${created.id}`);
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível criar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Uma contagem inicial vira um ajuste de compra, para o histórico começar do começo.">
    <template #title>
      <div class="product-new__title">
        <PageBackLink to="/products" label="Produtos" />
        <BText as="h1" variant="heading-1">Novo produto</BText>
      </div>
    </template>

    <form @submit.prevent="onSubmit">
      <SectionCard title="Dados do produto">
        <div class="product-new__fields">
          <BInput
            v-model="form.name"
            label="Nome"
            label-prepend-asterisk
            placeholder="Pomada modeladora"
            :helper-text="fieldErrors.name"
          />
          <BInputArea
            v-model="form.description"
            label="Descrição"
            rows="2"
            :helper-text="fieldErrors.description"
          />
          <div class="product-new__row">
            <BInput
              v-model="form.priceText"
              label="Preço de venda"
              label-prepend-asterisk
              placeholder="0,00"
              :helper-text="fieldErrors.priceText"
            />
            <BInput
              v-model="form.costText"
              label="Custo"
              placeholder="Opcional, para margem"
              :helper-text="fieldErrors.costText"
            />
          </div>
          <div class="product-new__row">
            <BInput
              v-model="form.stockQuantity"
              label="Estoque inicial"
              type="number"
              :helper-text="fieldErrors.stockQuantity"
            />
            <BInput
              v-model="form.lowStockThreshold"
              label="Alerta de estoque baixo"
              type="number"
              :helper-text="fieldErrors.lowStockThreshold"
            />
          </div>
        </div>

        <BText v-if="formError" as="p" variant="body-2" class="product-new__error">
          {{ formError }}
        </BText>

        <div class="product-new__actions">
          <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
            Criar produto
          </BButton>
          <BButton variant="outline" color="neutral" @click="router.push('/products')">
            Cancelar
          </BButton>
        </div>
      </SectionCard>
    </form>
  </PageLayout>
</template>

<style scoped>
.product-new__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.product-new__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.product-new__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .product-new__row {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.product-new__error {
  color: var(--b-fg-danger-primary, #b42318);
  margin-bottom: 0.75rem;
}

.product-new__actions {
  display: flex;
  gap: 0.5rem;
}
</style>
