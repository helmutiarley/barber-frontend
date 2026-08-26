<script setup lang="ts">
import {
  BButton,
  BDialog,
  BEmptyState,
  BInput,
  BInputArea,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deactivateService, getService, updateService } from '@/api/services';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  centsToMoneyInput,
  fieldErrorsFromZod,
  updateServiceSchema,
} from '@/features/services/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const serviceId = computed(() => String(route.params.id));

const { data, isPending, isError, refetch } = useQuery({
  queryKey: computed(() => ['services', serviceId.value] as const),
  queryFn: () => getService(serviceId.value),
});

const pageTitle = computed(() => data.value?.name ?? 'Editar serviço');
const isInactive = computed(() => data.value?.active === false);

const form = reactive({
  name: '',
  description: '',
  priceText: '',
  durationMinutes: 30 as number | string,
});

watch(
  data,
  (next) => {
    if (!next) return;
    form.name = next.name;
    form.description = next.description ?? '';
    form.priceText = centsToMoneyInput(next.priceCents);
    form.durationMinutes = next.durationMinutes;
  },
  { immediate: true },
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const deactivating = ref(false);
const confirmDeactivateOpen = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = updateServiceSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const description = parsed.data.description.trim();
    await updateService(serviceId.value, {
      name: parsed.data.name,
      priceCents: parsed.data.priceText,
      durationMinutes: parsed.data.durationMinutes,
      description: description === '' ? null : description,
    });
    await queryClient.invalidateQueries({ queryKey: ['services'] });
    toast.add({ message: 'Serviço atualizado.', severity: 'success' });
    await refetch();
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}

async function onDeactivate(): Promise<void> {
  deactivating.value = true;
  try {
    await deactivateService(serviceId.value);
    await queryClient.invalidateQueries({ queryKey: ['services'] });
    toast.add({ message: 'Serviço desativado.', severity: 'success' });
    await router.push('/services');
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível desativar.';
    toast.add({ message, severity: 'failure' });
  } finally {
    deactivating.value = false;
    confirmDeactivateOpen.value = false;
  }
}
</script>

<template>
  <PageLayout
    subtitle="Alterar preço ou duração não muda agendamentos já feitos — eles guardam o valor do momento."
  >
    <template #title>
      <div class="edit__title">
        <PageBackLink to="/services" label="Serviços" />
        <BText as="h1" variant="heading-1">{{ pageTitle }}</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="isPending" height="240px" />

    <BEmptyState
      v-else-if="isError || !data"
      title="Serviço não encontrado"
      subtitle="Ele pode ter sido removido ou o link está incorreto."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push('/services')">Voltar</BButton>
      </template>
    </BEmptyState>

    <form v-else class="edit__form" @submit.prevent="onSubmit">
      <SectionCard title="Dados do serviço">
        <div class="edit__fields">
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
          <div class="edit__row">
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

      <p v-if="isInactive" class="edit__inactive" role="status">
        Este serviço está inativo e não aparece no agendamento.
      </p>

      <p v-if="formError" class="edit__error" role="alert">{{ formError }}</p>

      <div class="edit__actions">
        <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
          Salvar
        </BButton>
        <BButton
          v-if="!isInactive"
          type="button"
          variant="outline"
          color="danger"
          @click="confirmDeactivateOpen = true"
        >
          Desativar
        </BButton>
      </div>
    </form>

    <BDialog
      :is-open="confirmDeactivateOpen"
      title-text="Desativar serviço?"
      width="420px"
      @update:is-open="confirmDeactivateOpen = $event"
    >
      <p>
        Desativar
        <strong>{{ data?.name }}</strong>
        remove o item do cardápio de agendamento. Agendamentos já feitos continuam intactos.
      </p>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="confirmDeactivateOpen = false">
          Cancelar
        </BButton>
        <BButton color="danger" :is-loading="deactivating" @click="onDeactivate">Desativar</BButton>
      </template>
    </BDialog>
  </PageLayout>
</template>

<style scoped>
.edit__title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
}

.edit__form {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
}

.edit__fields {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
}

.edit__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--b-spacing-sm);
}

.edit__inactive {
  color: var(--b-fg-neutral-secondary);
  font-size: 14px;
}

.edit__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.edit__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--b-spacing-xs);
}
</style>
