<script setup lang="ts">
import { BButton, BInput, BInputArea, BSkeletonLoader, useBToast } from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { getMe } from '@/api/auth';
import { getMyClient, updateMyClient } from '@/api/clients';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { usePermission } from '@/composables/usePermission';
import {
  emptyToNull,
  fieldErrorsFromZod,
  updateOwnClientSchema,
} from '@/features/clients/schemas';
import { updateSelfSchema } from '@/features/users/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const toast = useBToast();
const { hasRole } = usePermission();
const isClient = computed(() => hasRole('CLIENT'));

const form = reactive({
  name: auth.user?.name ?? '',
  phone: auth.user?.phone ?? '',
  currentPassword: '',
  newPassword: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const loading = ref(false);

const crmForm = reactive({
  birthday: '',
  preferences: '',
});
const crmErrors = ref<Record<string, string>>({});
const crmError = ref<string | null>(null);
const crmPending = ref(false);

const crmQuery = useQuery({
  queryKey: ['clients', 'me'] as const,
  queryFn: () => getMyClient(),
  enabled: isClient,
});

// `isLoading`, not `isPending`: the query is disabled for non-clients, and a
// disabled query stays pending forever, so the skeleton would never leave.
const { isLoading: crmLoading } = crmQuery;

watch(
  () => crmQuery.data.value,
  (data) => {
    if (!data) return;
    crmForm.birthday = data.birthday ?? '';
    crmForm.preferences = data.preferences ?? '';
  },
  { immediate: true },
);

onMounted(async () => {
  loading.value = true;
  try {
    const me = await getMe();
    auth.setUser(me);
    form.name = me.name;
    form.phone = me.phone ?? '';
  } catch {
    // keep store user
  } finally {
    loading.value = false;
  }
});

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = updateSelfSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  const body: {
    name: string;
    phone: string | null;
    currentPassword?: string;
    newPassword?: string;
  } = {
    name: parsed.data.name,
    phone: parsed.data.phone.trim() === '' ? null : parsed.data.phone.trim(),
  };

  if (parsed.data.newPassword) {
    body.currentPassword = parsed.data.currentPassword;
    body.newPassword = parsed.data.newPassword;
  }

  pending.value = true;
  try {
    await auth.updateMe(body);
    form.currentPassword = '';
    form.newPassword = '';
    toast.add({ message: 'Perfil atualizado.', severity: 'success' });
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}

async function onCrmSubmit(): Promise<void> {
  crmError.value = null;
  crmErrors.value = {};

  const parsed = updateOwnClientSchema.safeParse(crmForm);
  if (!parsed.success) {
    crmErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  crmPending.value = true;
  try {
    await updateMyClient({
      birthday: emptyToNull(parsed.data.birthday),
      preferences: emptyToNull(parsed.data.preferences),
    });
    toast.add({ message: 'Preferências salvas.', severity: 'success' });
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    crmError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    crmPending.value = false;
  }
}
</script>

<template>
  <PageLayout title="Perfil" :subtitle="auth.user?.email" :is-loading="loading">
    <form class="profile__form" @submit.prevent="onSubmit">
      <SectionCard title="Dados pessoais">
        <div class="profile__fields">
          <BInput
            v-model="form.name"
            label="Nome"
            label-prepend-asterisk
            :helper-text="fieldErrors.name"
          />
          <BInput
            v-model="form.phone"
            type="tel"
            label="Telefone"
            optional-text="opcional"
            :helper-text="fieldErrors.phone"
          />
        </div>
      </SectionCard>

      <SectionCard title="Alterar senha" subtitle="Deixe em branco para manter a senha atual.">
        <div class="profile__fields">
          <BInput
            v-model="form.currentPassword"
            type="password"
            label="Senha atual"
            autocomplete="current-password"
            :helper-text="fieldErrors.currentPassword"
          />
          <BInput
            v-model="form.newPassword"
            type="password"
            label="Nova senha"
            autocomplete="new-password"
            :helper-text="fieldErrors.newPassword"
          />
        </div>
      </SectionCard>

      <p v-if="formError" class="profile__error" role="alert">{{ formError }}</p>

      <div class="profile__actions">
        <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
          Salvar
        </BButton>
      </div>
    </form>

    <form
      v-if="isClient"
      class="profile__form profile__crm"
      @submit.prevent="onCrmSubmit"
    >
      <SectionCard
        title="Preferências de corte"
        subtitle="Aniversário e como você gosta do atendimento. Notas internas da loja não aparecem aqui."
      >
        <BSkeletonLoader v-if="crmLoading" height="120px" />
        <div v-else class="profile__fields">
          <BInput
            v-model="crmForm.birthday"
            type="date"
            label="Aniversário"
            :helper-text="crmErrors.birthday"
          />
          <BInputArea
            v-model="crmForm.preferences"
            label="Preferências"
            rows="3"
            placeholder="Máquina 2 na lateral…"
            :helper-text="crmErrors.preferences"
          />
        </div>
      </SectionCard>

      <p v-if="crmError" class="profile__error" role="alert">{{ crmError }}</p>

      <div class="profile__actions">
        <BButton
          type="submit"
          color="neutral"
          variant="contain"
          :is-loading="crmPending"
          :is-disabled="crmLoading"
        >
          Salvar preferências
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.profile__form {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
}

.profile__crm {
  margin-top: var(--b-spacing-lg, 1.5rem);
}

.profile__fields {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
}

.profile__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.profile__actions {
  display: flex;
  justify-content: flex-start;
}
</style>
