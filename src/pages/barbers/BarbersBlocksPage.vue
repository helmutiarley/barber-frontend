<script setup lang="ts">
import {
  BButton,
  BEmptyState,
  BInput,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery } from '@tanstack/vue-query';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createBlock, deleteBlock, getBarber } from '@/api/barbers';
import type { BlockDto } from '@/api/types';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { createBlockSchema, fieldErrorsFromZod } from '@/features/barbers/schemas';
import {
  ApiError,
  blockingAppointmentsFromDetails,
  messageForApiError,
  type BlockingAppointment,
} from '@/lib/errors';
import { formatShopDateTime, shopLocalToUtcIso, shopToday } from '@/lib/shop-time';

const route = useRoute();
const router = useRouter();
const toast = useBToast();

const barberId = computed(() => String(route.params.id));

const barberQuery = useQuery({
  queryKey: computed(() => ['barbers', barberId.value] as const),
  queryFn: () => getBarber(barberId.value),
});

const { isPending: barberPending, isError: barberFailed } = barberQuery;

const barberName = computed(() => barberQuery.data.value?.displayName ?? 'Barbeiro');

/**
 * The backend has no GET /blocks. We keep blocks created (or known) in this
 * session so the operator can delete them without leaving the page.
 */
const sessionBlocks = ref<BlockDto[]>([]);

const form = reactive({
  date: shopToday(),
  startTime: '09:00',
  endTime: '10:00',
  reason: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);
const deletingId = ref<string | null>(null);
const conflictAppointments = ref<BlockingAppointment[]>([]);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};
  conflictAppointments.value = [];

  const parsed = createBlockSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const created = await createBlock(barberId.value, {
      startsAt: shopLocalToUtcIso(parsed.data.date, parsed.data.startTime),
      endsAt: shopLocalToUtcIso(parsed.data.date, parsed.data.endTime),
      reason: parsed.data.reason.trim() === '' ? null : parsed.data.reason.trim(),
    });
    sessionBlocks.value = [created, ...sessionBlocks.value];
    form.reason = '';
    toast.add({ message: 'Bloqueio criado.', severity: 'success' });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CONFLICT') {
      const blocking = blockingAppointmentsFromDetails(error.details);
      conflictAppointments.value = blocking;
      const message = messageForApiError(error);
      formError.value = message;
      toast.add({ message, severity: 'warning' });
      return;
    }
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível criar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}

async function onDelete(blockId: string): Promise<void> {
  deletingId.value = blockId;
  try {
    await deleteBlock(barberId.value, blockId);
    sessionBlocks.value = sessionBlocks.value.filter((block) => block.id !== blockId);
    toast.add({ message: 'Bloqueio removido.', severity: 'success' });
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível remover.';
    toast.add({ message, severity: 'failure' });
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <PageLayout
    subtitle="Exceções pontuais (férias, dentista). Sobrepor um horário marcado gera conflito."
  >
    <template #title>
      <div class="blocks__title">
        <PageBackLink :to="`/barbers/${barberId}`" :label="barberName" />
        <BText as="h1" variant="heading-1">Bloqueios</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="barberPending" height="160px" />

    <BEmptyState
      v-else-if="barberFailed"
      title="Barbeiro não encontrado"
      subtitle="Volte à lista e tente de novo."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push('/barbers')">Voltar</BButton>
      </template>
    </BEmptyState>

    <template v-else>
      <form class="blocks__form" @submit.prevent="onSubmit">
        <SectionCard title="Novo bloqueio">
          <div class="blocks__fields">
            <BInput
              v-model="form.date"
              type="date"
              label="Data"
              label-prepend-asterisk
              :helper-text="fieldErrors.date"
            />
            <BInput
              v-model="form.startTime"
              label="Início"
              placeholder="09:00"
              label-prepend-asterisk
              :helper-text="fieldErrors.startTime"
            />
            <BInput
              v-model="form.endTime"
              label="Fim"
              placeholder="10:00"
              label-prepend-asterisk
              :helper-text="fieldErrors.endTime"
            />
            <BInput
              v-model="form.reason"
              label="Motivo"
              optional-text="opcional"
              placeholder="férias, dentista…"
              :helper-text="fieldErrors.reason"
            />
          </div>
        </SectionCard>

        <p v-if="formError" class="blocks__error" role="alert">{{ formError }}</p>

        <ul v-if="conflictAppointments.length" class="blocks__conflict">
          <li v-for="item in conflictAppointments" :key="item.id">
            {{ formatShopDateTime(item.startsAt) }}
            <span class="blocks__conflict-id">{{ item.id.slice(0, 8) }}…</span>
          </li>
        </ul>

        <div class="blocks__actions">
          <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
            Adicionar bloqueio
          </BButton>
        </div>
      </form>

      <SectionCard
        title="Nesta sessão"
        subtitle="A API ainda não lista bloqueios existentes — só os criados aqui aparecem até você sair da página."
      >
        <BEmptyState
          v-if="sessionBlocks.length === 0"
          title="Nenhum bloqueio nesta sessão"
          subtitle="Crie um acima para gerenciá-lo aqui."
        />

        <ul v-else class="blocks__list">
          <li v-for="block in sessionBlocks" :key="block.id" class="blocks__item">
            <div class="blocks__item-meta">
              <BText as="span" variant="body-2-bold">
                {{ formatShopDateTime(block.startsAt) }}
                –
                {{ formatShopDateTime(block.endsAt, 'HH:mm') }}
              </BText>
              <BText as="span" variant="body-2" color="b-fg-neutral-secondary">
                {{ block.reason || 'Sem motivo' }}
              </BText>
            </div>
            <BButton
              size="small"
              variant="outline"
              color="danger"
              icon-prepend="ic-bin-16"
              :is-loading="deletingId === block.id"
              :is-disabled="deletingId === block.id"
              @click="onDelete(block.id)"
            >
              Remover
            </BButton>
          </li>
        </ul>
      </SectionCard>
    </template>
  </PageLayout>
</template>

<style scoped>
.blocks__title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
}

.blocks__form {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
  margin-bottom: var(--b-spacing-md);
}

.blocks__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--b-spacing-2xs) var(--b-spacing-sm);
}

.blocks__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.blocks__conflict {
  margin: 0;
  padding-left: var(--b-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-3xs);
  font-size: 14px;
}

.blocks__conflict-id {
  margin-left: var(--b-spacing-3xs);
  color: var(--b-fg-neutral-secondary);
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.blocks__actions {
  display: flex;
  gap: var(--b-spacing-xs);
}

.blocks__list {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.blocks__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--b-spacing-xs);
  padding-bottom: var(--b-spacing-sm);
  border-bottom: 1px solid var(--b-stroke-default);
}

.blocks__item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.blocks__item-meta {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-4xs);
  min-width: 0;
}
</style>
