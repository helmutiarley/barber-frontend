<script setup lang="ts">
import { BButton, BInput, BInputArea, BText, useBToast } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getClient, isStaffClient, updateClient } from '@/api/clients';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  emptyToNull,
  fieldErrorsFromZod,
  updateClientSchema,
} from '@/features/clients/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const route = useRoute();
const router = useRouter();
const toast = useBToast();

const id = computed(() => String(route.params.id));

const detailQuery = useQuery({
  queryKey: computed(() => ['clients', id.value] as const),
  queryFn: () => getClient(id.value),
});

const form = reactive({
  birthday: '',
  preferences: '',
  internalNotes: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data || !isStaffClient(data)) return;
    form.birthday = data.birthday ?? '';
    form.preferences = data.preferences ?? '';
    form.internalNotes = data.internalNotes ?? '';
  },
  { immediate: true },
);

const name = computed(() => detailQuery.data.value?.name ?? 'Cliente');

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = updateClientSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await updateClient(id.value, {
      birthday: emptyToNull(parsed.data.birthday),
      preferences: emptyToNull(parsed.data.preferences),
      internalNotes: emptyToNull(parsed.data.internalNotes),
    });
    toast.add({ message: 'Cliente atualizado.', severity: 'success' });
    await router.push(`/clients/${id.value}`);
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Preferências, aniversário e notas internas (só equipe).">
    <template #title>
      <div class="edit__title">
        <PageBackLink :to="`/clients/${id}`" :label="name" />
        <BText as="h1" variant="heading-1">Editar cliente</BText>
      </div>
    </template>

    <form class="edit__form" @submit.prevent="onSubmit">
      <SectionCard title="Perfil CRM">
        <div class="edit__fields">
          <BInput
            v-model="form.birthday"
            type="date"
            label="Aniversário"
            :helper-text="fieldErrors.birthday"
          />
          <BInputArea
            v-model="form.preferences"
            label="Preferências"
            rows="3"
            placeholder="Máquina 2 na lateral, sem navalha…"
            :helper-text="fieldErrors.preferences"
          />
          <BInputArea
            v-model="form.internalNotes"
            label="Notas internas"
            rows="4"
            placeholder="Só a equipe vê isto."
            :helper-text="fieldErrors.internalNotes"
          />
        </div>
      </SectionCard>

      <BText v-if="formError" as="p" variant="body-2" class="edit__error" role="alert">
        {{ formError }}
      </BText>

      <div class="edit__actions">
        <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
          Salvar
        </BButton>
        <BButton
          type="button"
          variant="outline"
          color="neutral"
          @click="router.push(`/clients/${id}`)"
        >
          Cancelar
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.edit__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.edit__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit__error {
  color: var(--b-fg-danger-primary, #b42318);
}

.edit__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
