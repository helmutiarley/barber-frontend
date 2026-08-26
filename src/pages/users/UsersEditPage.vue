<script setup lang="ts">
import {
  BButton,
  BDialog,
  BEmptyState,
  BInput,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listUsers, updateUser } from '@/api/users';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { ALL_ROLE_OPTIONS, ROLE_LABELS } from '@/features/users/role-labels';
import { fieldErrorsFromZod, updateUserSchema } from '@/features/users/schemas';
import {
  ApiError,
  blockingAppointmentsFromDetails,
  messageForApiError,
  type BlockingAppointment,
} from '@/lib/errors';
import type { UserRole } from '@/lib/roles';
import { formatShopDateTime } from '@/lib/shop-time';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const userId = computed(() => String(route.params.id));

const { data, isPending } = useQuery({
  queryKey: ['users', {}] as const,
  queryFn: () => listUsers(),
});

const user = computed(() => data.value?.find((item) => item.id === userId.value));

const form = reactive({
  name: '',
  phone: '',
  role: 'BARBER' as UserRole,
  active: true,
});

watch(
  user,
  (next) => {
    if (!next) return;
    form.name = next.name;
    form.phone = next.phone ?? '';
    form.role = next.role;
    form.active = next.active;
  },
  { immediate: true },
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const confirmDeactivateOpen = ref(false);
const blockingOpen = ref(false);
const blockingAppointments = ref<BlockingAppointment[]>([]);

const activeSelect = computed({
  get: () => (form.active ? 'true' : 'false'),
  set: (value: string | number) => {
    form.active = String(value) === 'true';
  },
});

async function save(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};
  blockingAppointments.value = [];

  const parsed = updateUserSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await updateUser(userId.value, {
      name: parsed.data.name,
      phone: parsed.data.phone.trim() === '' ? null : parsed.data.phone.trim(),
      role: parsed.data.role,
      active: parsed.data.active,
    });
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.add({ message: 'Usuário atualizado.', severity: 'success' });
    await router.push('/users');
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CONFLICT') {
      const blocking = blockingAppointmentsFromDetails(error.details);
      if (blocking.length > 0) {
        form.active = true;
        blockingAppointments.value = blocking;
        blockingOpen.value = true;
        toast.add({ message: messageForApiError(error), severity: 'warning' });
        return;
      }
    }
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível salvar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
    confirmDeactivateOpen.value = false;
  }
}

function onSubmit(): void {
  if (user.value?.active && !form.active) {
    confirmDeactivateOpen.value = true;
    return;
  }
  void save();
}
</script>

<template>
  <PageLayout :subtitle="user?.email ?? undefined">
    <template #title>
      <div class="edit__title">
        <PageBackLink to="/users" label="Usuários" />
        <BText as="h1" variant="heading-1">Editar usuário</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="isPending" height="240px" />

    <BEmptyState
      v-else-if="!user"
      title="Usuário não encontrado"
      subtitle="Ele pode ter sido removido ou o link está incorreto."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push('/users')">Voltar</BButton>
      </template>
    </BEmptyState>

    <form v-else class="edit__form" @submit.prevent="onSubmit">
      <SectionCard title="Dados da conta">
        <div class="edit__fields">
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

      <SectionCard title="Acesso" subtitle="Perfil e status de login desta conta.">
        <div class="edit__fields">
          <BSelect
            v-model="form.role"
            label="Perfil"
            :options="ALL_ROLE_OPTIONS"
            :helper-text="fieldErrors.role"
          />
          <BSelect
            v-model="activeSelect"
            label="Status"
            :options="[
              { label: 'Ativo', value: 'true' },
              { label: 'Inativo', value: 'false' },
            ]"
          />
        </div>
      </SectionCard>

      <p v-if="formError" class="edit__error" role="alert">{{ formError }}</p>

      <div class="edit__actions">
        <BButton type="button" variant="outline" color="neutral" @click="router.push('/users')">
          Cancelar
        </BButton>
        <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
          Salvar
        </BButton>
      </div>
    </form>

    <BDialog
      :is-open="confirmDeactivateOpen"
      title-text="Desativar usuário?"
      width="420px"
      @update:is-open="confirmDeactivateOpen = $event"
    >
      <p>
        Desativar
        <strong>{{ user?.name }}</strong>
        ({{ user ? ROLE_LABELS[user.role] : '' }}) impede o login. Se for barbeiro com horários
        futuros, a operação será bloqueada.
      </p>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="confirmDeactivateOpen = false">
          Cancelar
        </BButton>
        <BButton color="danger" :is-loading="pending" @click="save">Desativar</BButton>
      </template>
    </BDialog>

    <BDialog
      :is-open="blockingOpen"
      title-text="Não é possível desativar"
      width="480px"
      @update:is-open="blockingOpen = $event"
    >
      <p>Existem agendamentos futuros. Reagende ou cancele antes de desativar:</p>
      <ul class="edit__blocking">
        <li v-for="item in blockingAppointments" :key="item.id">
          {{ formatShopDateTime(item.startsAt) }}
          <span class="edit__blocking-id">{{ item.id.slice(0, 8) }}…</span>
        </li>
      </ul>
      <template #footer>
        <BButton color="neutral" @click="blockingOpen = false">Entendi</BButton>
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

.edit__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.edit__actions {
  display: flex;
  gap: var(--b-spacing-xs);
}

.edit__blocking {
  margin: var(--b-spacing-sm) 0 0;
  padding-left: var(--b-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-3xs);
  font-size: 14px;
}

.edit__blocking-id {
  margin-left: var(--b-spacing-3xs);
  color: var(--b-fg-neutral-secondary);
  font-family: ui-monospace, monospace;
  font-size: 12px;
}
</style>
