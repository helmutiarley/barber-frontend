<script setup lang="ts">
import { BButton, BInput, BInputArea, BText, useBToast } from '@/ui';
import { useQueryClient } from '@tanstack/vue-query';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createService } from '@/api/services';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { createServiceSchema, fieldErrorsFromZod } from '@/features/services/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const form = reactive({
  name: '',
  description: '',
  priceText: '',
  durationMinutes: 30 as number | string,
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = createServiceSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const description = parsed.data.description.trim();
    const created = await createService({
      name: parsed.data.name,
      priceCents: parsed.data.priceText,
      durationMinutes: parsed.data.durationMinutes,
      description: description === '' ? null : description,
    });
    await queryClient.invalidateQueries({ queryKey: ['services'] });
    toast.add({ message: 'Serviço criado.', severity: 'success' });
    await router.push(`/services/${created.id}`);
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
  <PageLayout subtitle="Nome, preço e duração passam a valer para novos agendamentos.">
    <template #title>
      <div class="create__title">
        <PageBackLink to="/services" label="Serviços" />
        <BText as="h1" variant="heading-1">Novo serviço</BText>
      </div>
    </template>

    <form class="create__form" @submit.prevent="onSubmit">
      <SectionCard title="Dados do serviço">
        <div class="create__fields">
          <BInput
            v-model="form.name"
            label="Nome"
            label-prepend-asterisk
            :helper-text="fieldErrors.name"
          />
          <BInputArea
            v-model="form.description"
            label="Descrição"
            optional-text="opcional"
            :visible-text-row-count="3"
            :helper-text="fieldErrors.description"
          />
          <div class="create__row">
            <BInput
              v-model="form.priceText"
              label="Preço"
              label-prepend-asterisk
              placeholder="45,00"
              :helper-text="fieldErrors.priceText || 'Em reais (ex.: 45,00).'"
            />
            <BInput
              v-model="form.durationMinutes"
              type="number"
              label="Duração (minutos)"
              label-prepend-asterisk
              :min="1"
              :max="600"
              :helper-text="fieldErrors.durationMinutes"
            />
          </div>
        </div>
      </SectionCard>

      <p v-if="formError" class="create__error" role="alert">{{ formError }}</p>

      <div class="create__actions">
        <BButton type="button" variant="outline" color="neutral" @click="router.push('/services')">
          Cancelar
        </BButton>
        <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
          Criar
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.create__title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
}

.create__form {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
}

.create__fields {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
}

.create__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--b-spacing-sm);
}

.create__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.create__actions {
  display: flex;
  gap: var(--b-spacing-xs);
}
</style>
