<script setup lang="ts">
import { BButton, BInput, BSelect, BText, useBToast } from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createBarber } from '@/api/barbers';
import { listUsers } from '@/api/users';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { createBarberSchema, fieldErrorsFromZod } from '@/features/barbers/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const form = reactive({
  userId: '',
  displayName: '',
  photoUrl: '',
  specialtiesText: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

const usersQuery = useQuery({
  queryKey: ['users', { role: 'BARBER', active: true }] as const,
  queryFn: () => listUsers({ role: 'BARBER', active: true }),
});

const { isPending: usersPending, isError: usersFailed } = usersQuery;

const userOptions = computed(() =>
  (usersQuery.data.value ?? []).map((user) => ({
    label: user.email ? `${user.name} (${user.email})` : user.name,
    value: user.id,
  })),
);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = createBarberSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const photo = parsed.data.photoUrl.trim();
    const created = await createBarber({
      userId: parsed.data.userId,
      displayName: parsed.data.displayName,
      specialties: parsed.data.specialtiesText,
      ...(photo ? { photoUrl: photo } : { photoUrl: null }),
    });
    await queryClient.invalidateQueries({ queryKey: ['barbers'] });
    toast.add({ message: 'Barbeiro criado.', severity: 'success' });
    await router.push(`/barbers/${created.id}`);
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
  <PageLayout subtitle="Vincula um usuário Barbeiro a um perfil público de agendamento.">
    <template #title>
      <div class="create__title">
        <PageBackLink to="/barbers" label="Barbeiros" />
        <BText as="h1" variant="heading-1">Novo barbeiro</BText>
      </div>
    </template>

    <form class="create__form" @submit.prevent="onSubmit">
      <SectionCard title="Perfil">
        <div class="create__fields">
          <BSelect
            v-model="form.userId"
            label="Usuário"
            label-prepend-asterisk
            :options="userOptions"
            :helper-text="fieldErrors.userId || (usersFailed ? 'Não foi possível carregar usuários.' : undefined)"
            :is-disabled="usersPending"
          />
          <BInput
            v-model="form.displayName"
            label="Nome de exibição"
            label-prepend-asterisk
            :helper-text="fieldErrors.displayName"
          />
          <BInput
            v-model="form.photoUrl"
            type="url"
            label="URL da foto"
            optional-text="opcional"
            :helper-text="fieldErrors.photoUrl"
          />
          <BInput
            v-model="form.specialtiesText"
            label="Especialidades"
            optional-text="opcional"
            placeholder="fade, barba, navalha"
            :helper-text="fieldErrors.specialtiesText || 'Separe as tags por vírgula.'"
          />
        </div>
      </SectionCard>

      <p v-if="formError" class="create__error" role="alert">{{ formError }}</p>

      <div class="create__actions">
        <BButton type="button" variant="outline" color="neutral" @click="router.push('/barbers')">
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

.create__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.create__actions {
  display: flex;
  gap: var(--b-spacing-xs);
}
</style>
