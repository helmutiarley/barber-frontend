<script setup lang="ts">
import {
  BButton,
  BDialog,
  BEmptyState,
  BInput,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { deactivateBarber, getBarber, updateBarber } from '@/api/barbers';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { fieldErrorsFromZod, updateBarberSchema } from '@/features/barbers/schemas';
import {
  ApiError,
  blockingAppointmentsFromDetails,
  messageForApiError,
  type BlockingAppointment,
} from '@/lib/errors';
import { formatShopDateTime } from '@/lib/shop-time';
import { usePermission } from '@/composables/usePermission';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const { hasRole } = usePermission();

const barberId = computed(() => String(route.params.id));
const isAdmin = computed(() => hasRole('ADMIN'));

const { data, isPending, isError, refetch } = useQuery({
  queryKey: computed(() => ['barbers', barberId.value] as const),
  queryFn: () => getBarber(barberId.value),
});

const form = reactive({
  displayName: '',
  photoUrl: '',
  specialtiesText: '',
});

watch(
  data,
  (next) => {
    if (!next) return;
    form.displayName = next.displayName;
    form.photoUrl = next.photoUrl ?? '';
    form.specialtiesText = next.specialties.join(', ');
  },
  { immediate: true },
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const deactivating = ref(false);
const confirmDeactivateOpen = ref(false);
const blockingOpen = ref(false);
const blockingAppointments = ref<BlockingAppointment[]>([]);

async function onSubmit(): Promise<void> {
  if (!isAdmin.value) return;

  formError.value = null;
  fieldErrors.value = {};

  const parsed = updateBarberSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const photo = parsed.data.photoUrl.trim();
    await updateBarber(barberId.value, {
      displayName: parsed.data.displayName,
      specialties: parsed.data.specialtiesText,
      photoUrl: photo === '' ? null : photo,
    });
    await queryClient.invalidateQueries({ queryKey: ['barbers'] });
    toast.add({ message: 'Perfil atualizado.', severity: 'success' });
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
  blockingAppointments.value = [];
  try {
    await deactivateBarber(barberId.value);
    await queryClient.invalidateQueries({ queryKey: ['barbers'] });
    toast.add({ message: 'Barbeiro desativado.', severity: 'success' });
    await router.push('/barbers');
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CONFLICT') {
      const blocking = blockingAppointmentsFromDetails(error.details);
      if (blocking.length > 0) {
        blockingAppointments.value = blocking;
        blockingOpen.value = true;
        toast.add({ message: messageForApiError(error), severity: 'warning' });
        return;
      }
    }
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
  <PageLayout>
    <template #title>
      <div class="detail__title">
        <PageBackLink to="/barbers" label="Barbeiros" />
        <BText as="h1" variant="heading-1">{{ data?.displayName ?? 'Barbeiro' }}</BText>
      </div>
    </template>

    <template #header-actions>
      <RouterLink :to="`/barbers/${barberId}/schedule`">
        <BButton variant="outline" color="neutral">Horário</BButton>
      </RouterLink>
      <RouterLink :to="`/barbers/${barberId}/blocks`">
        <BButton variant="outline" color="neutral">Bloqueios</BButton>
      </RouterLink>
    </template>

    <BSkeletonLoader v-if="isPending" height="240px" />

    <BEmptyState
      v-else-if="isError || !data"
      title="Barbeiro não encontrado"
      subtitle="Ele pode ter sido removido ou o link está incorreto."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push('/barbers')">Voltar</BButton>
      </template>
    </BEmptyState>

    <form v-else class="detail__form" @submit.prevent="onSubmit">
      <SectionCard
        title="Perfil público"
        :subtitle="isAdmin ? undefined : 'Somente administradores alteram o perfil.'"
      >
        <div class="detail__fields">
          <BInput
            v-model="form.displayName"
            label="Nome de exibição"
            label-prepend-asterisk
            :is-disabled="!isAdmin"
            :helper-text="fieldErrors.displayName"
          />
          <BInput
            v-model="form.photoUrl"
            type="url"
            label="URL da foto"
            optional-text="opcional"
            :is-disabled="!isAdmin"
            :helper-text="fieldErrors.photoUrl"
          />
          <BInput
            v-model="form.specialtiesText"
            label="Especialidades"
            optional-text="opcional"
            placeholder="fade, barba, navalha"
            :is-disabled="!isAdmin"
            :helper-text="fieldErrors.specialtiesText || 'Separe as tags por vírgula.'"
          />
        </div>
      </SectionCard>

      <p v-if="formError" class="detail__error" role="alert">{{ formError }}</p>

      <div v-if="isAdmin" class="detail__actions">
        <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
          Salvar
        </BButton>
        <BButton
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
      title-text="Desativar barbeiro?"
      width="420px"
      @update:is-open="confirmDeactivateOpen = $event"
    >
      <p>
        Desativar
        <strong>{{ data?.displayName }}</strong>
        remove o perfil da listagem e do agendamento. Agendamentos futuros bloqueiam a operação.
      </p>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="confirmDeactivateOpen = false">
          Cancelar
        </BButton>
        <BButton color="danger" :is-loading="deactivating" @click="onDeactivate">Desativar</BButton>
      </template>
    </BDialog>

    <BDialog
      :is-open="blockingOpen"
      title-text="Não é possível desativar"
      width="480px"
      @update:is-open="blockingOpen = $event"
    >
      <p>Existem agendamentos futuros. Reagende ou cancele antes de desativar:</p>
      <ul class="detail__blocking">
        <li v-for="item in blockingAppointments" :key="item.id">
          {{ formatShopDateTime(item.startsAt) }}
          <span class="detail__blocking-id">{{ item.id.slice(0, 8) }}…</span>
        </li>
      </ul>
      <template #footer>
        <BButton color="neutral" @click="blockingOpen = false">Entendi</BButton>
      </template>
    </BDialog>
  </PageLayout>
</template>

<style scoped>
.detail__title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
}

.detail__form {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
}

.detail__fields {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
}

.detail__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--b-spacing-xs);
}

.detail__blocking {
  margin: var(--b-spacing-sm) 0 0;
  padding-left: var(--b-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-3xs);
  font-size: 14px;
}

.detail__blocking-id {
  margin-left: var(--b-spacing-3xs);
  color: var(--b-fg-neutral-secondary);
  font-family: ui-monospace, monospace;
  font-size: 12px;
}
</style>
