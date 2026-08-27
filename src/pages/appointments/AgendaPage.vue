<script setup lang="ts">
import {
  BButton,
  BCard,
  BEmptyState,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  completeAppointment,
  confirmAppointment,
  getBarberAgenda,
  markNoShow,
} from '@/api/appointments';
import { listBarbers } from '@/api/barbers';
import { listServices } from '@/api/services';
import type { AppointmentDto } from '@/api/types';
import PageLayout from '@/components/layout/PageLayout.vue';
import { useOwnBarberId } from '@/composables/useOwnBarberId';
import { usePermission } from '@/composables/usePermission';
import { availableActions } from '@/features/appointments/actions';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/features/appointments/status-labels';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime, shopToday } from '@/lib/shop-time';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const { hasRole, role } = usePermission();
const { ownBarberId, resolving: resolvingOwn, resolveError } = useOwnBarberId();

const isStaffPicker = computed(() => hasRole('ADMIN') || hasRole('MANAGER'));
const canBook = computed(() => hasRole('ADMIN') || hasRole('MANAGER'));

const date = computed({
  get: () => (typeof route.query.date === 'string' ? route.query.date : shopToday()),
  set: (value: string) => {
    void router.replace({
      query: { ...route.query, date: value || undefined },
    });
  },
});

const barberId = computed({
  get: () => {
    if (!isStaffPicker.value) {
      return ownBarberId.value ?? '';
    }
    return typeof route.query.barberId === 'string' ? route.query.barberId : '';
  },
  set: (value: string | number) => {
    void router.replace({
      query: {
        ...route.query,
        barberId: value ? String(value) : undefined,
      },
    });
  },
});

watch(
  [ownBarberId, isStaffPicker],
  ([id, staff]) => {
    if (!staff && id && route.query.barberId !== id) {
      void router.replace({ query: { ...route.query, barberId: id } });
    }
  },
  { immediate: true },
);

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const { isPending: barbersPending } = barbersQuery;

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: true }] as const,
  queryFn: () => listServices({ includeInactive: true }),
});

const barberOptions = computed(() =>
  (barbersQuery.data.value ?? []).map((b) => ({ label: b.displayName, value: b.id })),
);

watch(
  [isStaffPicker, barberOptions, barberId],
  ([staff, options, current]) => {
    if (staff && options.length && !current) {
      barberId.value = options[0]!.value;
    }
  },
  { immediate: true },
);

const agendaEnabled = computed(() => Boolean(barberId.value) && Boolean(date.value));

const agendaQuery = useQuery({
  queryKey: computed(
    () => ['agenda', barberId.value, date.value] as const,
  ),
  queryFn: () => getBarberAgenda(barberId.value, date.value),
  enabled: agendaEnabled,
});

const { isLoading: agendaLoading, isError: agendaFailed } = agendaQuery;

const rows = computed(() => agendaQuery.data.value ?? []);

const serviceName = computed(() => {
  const map = new Map((servicesQuery.data.value ?? []).map((s) => [s.id, s.name]));
  return (id: string) => map.get(id) ?? 'Serviço';
});

const barberName = computed(() => {
  const map = new Map((barbersQuery.data.value ?? []).map((b) => [b.id, b.displayName]));
  return (id: string) => map.get(id) ?? 'Barbeiro';
});

const actionPending = ref<string | null>(null);

async function invalidateAgenda(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ['agenda'] });
  await queryClient.invalidateQueries({ queryKey: ['appointments'] });
}

function rowActions(row: AppointmentDto) {
  if (!role.value) return [];
  return availableActions(row, role.value, { ownBarberId: ownBarberId.value });
}

const confirmMut = useMutation({
  mutationFn: (id: string) => confirmAppointment(id),
  onSuccess: async () => {
    toast.add({ message: 'Horário confirmado.', severity: 'success' });
    await invalidateAgenda();
  },
  onError: (error) => {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao confirmar.',
      severity: 'failure',
    });
  },
});

const completeMut = useMutation({
  mutationFn: (id: string) => completeAppointment(id),
  onSuccess: async () => {
    toast.add({ message: 'Atendimento concluído.', severity: 'success' });
    await invalidateAgenda();
  },
  onError: (error) => {
    if (error instanceof ApiError && error.code === 'CONFLICT') {
      toast.add({
        message:
          'Não há regra de comissão para este barbeiro/serviço. Configure em Comissões e tente de novo.',
        severity: 'warning',
      });
      return;
    }
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao concluir.',
      severity: 'failure',
    });
  },
});

const noShowMut = useMutation({
  mutationFn: (id: string) => markNoShow(id),
  onSuccess: async () => {
    toast.add({ message: 'Marcado como não compareceu.', severity: 'success' });
    await invalidateAgenda();
  },
  onError: (error) => {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao marcar.',
      severity: 'failure',
    });
  },
});

async function runAction(
  kind: 'confirm' | 'complete' | 'no_show',
  id: string,
): Promise<void> {
  actionPending.value = `${kind}:${id}`;
  try {
    if (kind === 'confirm') await confirmMut.mutateAsync(id);
    else if (kind === 'complete') await completeMut.mutateAsync(id);
    else await noShowMut.mutateAsync(id);
  } finally {
    actionPending.value = null;
  }
}

function shiftDay(delta: number): void {
  const [y, m, d] = date.value.split('-').map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + delta));
  const iso = next.toISOString().slice(0, 10);
  date.value = iso;
}
</script>

<template>
  <PageLayout
    title="Agenda"
    subtitle="Dia do barbeiro no fuso da loja. Cancelados e faltas explicam os buracos."
  >
    <template v-if="canBook" #header-actions>
      <RouterLink to="/appointments/new">
        <BButton color="neutral" variant="contain" icon-prepend="ic-add-16">Novo horário</BButton>
      </RouterLink>
    </template>

    <BCard class="agenda__filters">
      <div class="agenda__filters-row">
        <label class="agenda__date">
          <span class="agenda__date-label">Data</span>
          <div class="agenda__date-controls">
            <BButton size="small" variant="outline" color="neutral" @click="shiftDay(-1)">
              ←
            </BButton>
            <input v-model="date" class="agenda__date-input" type="date" />
            <BButton size="small" variant="outline" color="neutral" @click="shiftDay(1)">
              →
            </BButton>
            <BButton
              size="small"
              variant="outline"
              color="neutral"
              @click="date = shopToday()"
            >
              Hoje
            </BButton>
          </div>
        </label>

        <BSelect
          v-if="isStaffPicker"
          v-model="barberId"
          label="Barbeiro"
          :options="barberOptions"
          :is-disabled="barbersPending || barberOptions.length === 0"
        />
        <div v-else class="agenda__locked">
          <BText as="span" variant="body-3" color="b-fg-neutral-secondary">Barbeiro</BText>
          <BText as="span" variant="body-2-bold">
            {{ barberId ? barberName(barberId) : '…' }}
          </BText>
        </div>
      </div>
    </BCard>

    <BEmptyState
      v-if="!isStaffPicker && resolveError"
      title="Perfil não encontrado"
      :subtitle="resolveError"
    />

    <BSkeletonLoader
      v-else-if="(!isStaffPicker && resolvingOwn) || agendaLoading"
      height="280px"
    />

    <BEmptyState
      v-else-if="!barberId"
      title="Escolha um barbeiro"
      subtitle="Selecione quem está na cadeira hoje."
    />

    <BEmptyState
      v-else-if="agendaFailed"
      title="Não foi possível carregar"
      subtitle="Tente outra data ou outro barbeiro."
    />

    <BEmptyState
      v-else-if="rows.length === 0"
      title="Nada neste dia"
      subtitle="Sem horários marcados — a agenda está livre."
    />

    <BCard v-else padding="0" class="agenda__table-card">
      <div class="agenda__table-wrap">
        <table class="agenda__table">
          <thead>
            <tr>
              <th>Horário</th>
              <th>Serviço</th>
              <th>Valor</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <BText as="span" variant="body-2-bold">
                  {{ formatShopDateTime(row.startsAt, 'HH:mm') }}
                </BText>
                <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
                  – {{ formatShopDateTime(row.endsAt, 'HH:mm') }}
                </BText>
              </td>
              <td>
                <div class="agenda__service">
                  <BText as="span" variant="body-2">{{ serviceName(row.serviceId) }}</BText>
                  <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
                    {{ row.durationMinutes }} min
                  </BText>
                </div>
              </td>
              <td>{{ formatMoney(row.priceCents) }}</td>
              <td>
                <BLabel :color="APPOINTMENT_STATUS_COLORS[row.status]">
                  {{ APPOINTMENT_STATUS_LABELS[row.status] }}
                </BLabel>
              </td>
              <td class="agenda__actions">
                <RouterLink :to="`/appointments/${row.id}`">
                  <BButton size="small" variant="outline" color="neutral">Abrir</BButton>
                </RouterLink>
                <BButton
                  v-if="rowActions(row).includes('confirm')"
                  size="small"
                  variant="outline"
                  color="neutral"
                  :is-loading="actionPending === `confirm:${row.id}`"
                  @click="runAction('confirm', row.id)"
                >
                  Confirmar
                </BButton>
                <BButton
                  v-if="rowActions(row).includes('complete')"
                  size="small"
                  color="neutral"
                  variant="contain"
                  :is-loading="actionPending === `complete:${row.id}`"
                  @click="runAction('complete', row.id)"
                >
                  Concluir
                </BButton>
                <BButton
                  v-if="rowActions(row).includes('no_show')"
                  size="small"
                  variant="outline"
                  color="danger"
                  :is-loading="actionPending === `no_show:${row.id}`"
                  @click="runAction('no_show', row.id)"
                >
                  Falta
                </BButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BCard>
  </PageLayout>
</template>

<style scoped>
.agenda__filters {
  margin-bottom: 1rem;
}

.agenda__filters-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .agenda__filters-row {
    grid-template-columns: 1.4fr 1fr;
    align-items: end;
  }
}

.agenda__date {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.agenda__date-label {
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.agenda__date-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.agenda__date-input {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-stroke-neutral-mid, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-default, #fff);
  color: inherit;
  font: inherit;
}

.agenda__locked {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  justify-content: end;
  padding-bottom: 0.35rem;
}

.agenda__table-card {
  overflow: hidden;
}

.agenda__table-wrap {
  overflow-x: auto;
}

.agenda__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.agenda__table th,
.agenda__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--b-stroke-default, #eaecf0);
  vertical-align: middle;
}

.agenda__table th {
  font-weight: 600;
  color: var(--b-fg-neutral-secondary, #667085);
  white-space: nowrap;
}

.agenda__service {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.agenda__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}
</style>
