<script setup lang="ts">
import { BButton, BInput, BSelect, BText, useBToast } from '@/ui';
import { useQueryClient } from '@tanstack/vue-query';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createStaff } from '@/api/users';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { STAFF_ROLE_OPTIONS } from '@/features/users/role-labels';
import { createStaffSchema, fieldErrorsFromZod } from '@/features/users/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'BARBER' as 'MANAGER' | 'BARBER',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = createStaffSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const phone = parsed.data.phone.trim();
    await createStaff({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
      ...(phone ? { phone } : {}),
    });
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.add({ message: 'Usuário criado.', severity: 'success' });
    await router.push('/users');
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
  <PageLayout subtitle="Cria contas de gerente ou barbeiro.">
    <template #title>
      <div class="create__title">
        <PageBackLink to="/users" label="Usuários" />
        <BText as="h1" variant="heading-1">Novo usuário</BText>
      </div>
    </template>

    <form class="create__form" @submit.prevent="onSubmit">
      <SectionCard title="Dados da conta">
        <div class="create__fields">
          <BInput
            v-model="form.name"
            label="Nome"
            label-prepend-asterisk
            :helper-text="fieldErrors.name"
          />
          <BInput
            v-model="form.email"
            type="email"
            label="Email"
            label-prepend-asterisk
            :helper-text="fieldErrors.email"
          />
          <BInput
            v-model="form.phone"
            type="tel"
            label="Telefone"
            optional-text="opcional"
            :helper-text="fieldErrors.phone"
          />
          <BInput
            v-model="form.password"
            type="password"
            label="Senha temporária"
            label-prepend-asterisk
            autocomplete="new-password"
            :helper-text="fieldErrors.password"
          />
          <BSelect
            v-model="form.role"
            label="Perfil"
            :options="STAFF_ROLE_OPTIONS"
            :helper-text="fieldErrors.role"
          />
        </div>
      </SectionCard>

      <p v-if="formError" class="create__error" role="alert">{{ formError }}</p>

      <div class="create__actions">
        <BButton type="button" variant="outline" color="neutral" @click="router.push('/users')">
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
