<script setup lang="ts">
import {
  BButton,
  BDialog,
  BEmptyState,
  BInput,
  BInputArea,
  BLabel,
  BSelect,
  BSkeletonLoader,
  BText,
  useBToast,
} from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  getAppointment,
  markNoShow,
  rescheduleAppointment,
} from '@/api/appointments';
import { getAvailability, listBarbers } from '@/api/barbers';
import { activePaidCents, listAppointmentPayments } from '@/api/payments';
import { listServices } from '@/api/services';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { useOwnBarberId } from '@/composables/useOwnBarberId';
import { usePermission } from '@/composables/usePermission';
import {
  availableActions,
  cancellationWindowHours,
  isInsideCancellationWindow,
} from '@/features/appointments/actions';
import {
  cancelSchema,
  clientCancelSchema,
  fieldErrorsFromZod,
  rescheduleSchema,
} from '@/features/appointments/schemas';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/features/appointments/status-labels';
import { PAYMENT_METHOD_LABELS } from '@/features/payments/method-labels';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import type { UserRole } from '@/lib/roles';
import { formatShopDateTime, shopToday } from '@/lib/shop-time';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const auth = useAuthStore();
const { hasRole, role } = usePermission();
const { ownBarberId } = useOwnBarberId();

const id = computed(() => String(route.params.id));
const isStaff = computed(() => hasRole('ADMIN') || hasRole('MANAGER'));
const isClient = computed(() => hasRole('CLIENT'));
const canOpenClient = computed(() => isStaff.value || hasRole('BARBER'));

const detailQuery = useQuery({
  queryKey: computed(() => ['appointments', id.value] as const),
  queryFn: () => getAppointment(id.value),
});

const { isPending: detailPending, isError: detailFailed } = detailQuery;

const paymentsQuery = useQuery({
  queryKey: computed(() => ['appointments', id.value, 'payments'] as const),
  queryFn: () => listAppointmentPayments(id.value),
  enabled: computed(() => !isClient.value),
});

// `isLoading`, not `isPending`: a disabled query stays pending forever, which
// would keep the skeleton up even when nothing is being fetched.
const { isLoading: paymentsLoading } = paymentsQuery;

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: true }] as const,
  queryFn: () => listServices({ includeInactive: true }),
});

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const appointment = computed(() => detailQuery.data.value);
const payments = computed(() => paymentsQuery.data.value ?? []);
const paidCents = computed(() => activePaidCents(payments.value));
const remainingCents = computed(() =>
  appointment.value ? Math.max(0, appointment.value.priceCents - paidCents.value) : 0,
);
const canCollectPayment = computed(
  () =>
    isStaff.value &&
    appointment.value &&
    (appointment.value.status === 'confirmed' || appointment.value.status === 'completed') &&
    remainingCents.value > 0,
);

const serviceName = computed(() => {
  const map = new Map((servicesQuery.data.value ?? []).map((s) => [s.id, s.name]));
  return appointment.value ? (map.get(appointment.value.serviceId) ?? 'Serviço') : 'Serviço';
});
const barberName = computed(() => {
  const map = new Map((barbersQuery.data.value ?? []).map((b) => [b.id, b.displayName]));
  return appointment.value ? (map.get(appointment.value.barberId) ?? 'Barbeiro') : 'Barbeiro';
});

const actions = computed(() => {
  if (!appointment.value || !role.value) return [];
  return availableActions(appointment.value, role.value as UserRole, {
    ownBarberId: ownBarberId.value,
  });
});

const clientBlocked = computed(
  () =>
    isClient.value &&
    appointment.value &&
    (appointment.value.status === 'scheduled' || appointment.value.status === 'confirmed') &&
    isInsideCancellationWindow(appointment.value.startsAt),
);

const backTo = computed(() => {
  if (isClient.value) return '/me/appointments';
  if (isStaff.value) return '/appointments';
  return '/agenda';
});

async function invalidateAll(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ['appointments'] });
  await queryClient.invalidateQueries({ queryKey: ['agenda'] });
  await queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
}

const actionPending = ref(false);

async function runConfirm(): Promise<void> {
  actionPending.value = true;
  try {
    await confirmAppointment(id.value);
    toast.add({ message: 'Horário confirmado.', severity: 'success' });
    await invalidateAll();
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao confirmar.',
      severity: 'failure',
    });
  } finally {
    actionPending.value = false;
  }
}

async function runComplete(): Promise<void> {
  actionPending.value = true;
  try {
    await completeAppointment(id.value);
    toast.add({ message: 'Atendimento concluído.', severity: 'success' });
    await invalidateAll();
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CONFLICT') {
      toast.add({
        message:
          'Não há regra de comissão para este barbeiro/serviço. Configure em Comissões.',
        severity: 'warning',
      });
      return;
    }
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao concluir.',
      severity: 'failure',
    });
  } finally {
    actionPending.value = false;
  }
}

async function runNoShow(): Promise<void> {
  actionPending.value = true;
  try {
    await markNoShow(id.value);
    toast.add({ message: 'Marcado como não compareceu.', severity: 'success' });
    await invalidateAll();
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao marcar.',
      severity: 'failure',
    });
  } finally {
    actionPending.value = false;
  }
}

const cancelOpen = ref(false);
const cancelForm = reactive({ reason: '' });
const cancelErrors = ref<Record<string, string>>({});
const cancelPending = ref(false);

function openCancel(): void {
  cancelForm.reason = '';
  cancelErrors.value = {};
  cancelOpen.value = true;
}

async function submitCancel(): Promise<void> {
  cancelErrors.value = {};
  const schema = isStaff.value ? cancelSchema : clientCancelSchema;
  const parsed = schema.safeParse(cancelForm);
  if (!parsed.success) {
    cancelErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  cancelPending.value = true;
  try {
    const reason = parsed.data.reason.trim();
    await cancelAppointment(id.value, reason || undefined);
    toast.add({ message: 'Horário cancelado.', severity: 'success' });
    cancelOpen.value = false;
    await invalidateAll();
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao cancelar.',
      severity: 'failure',
    });
  } finally {
    cancelPending.value = false;
  }
}

const rescheduleOpen = ref(false);
const rescheduleForm = reactive({
  date: shopToday(),
  startsAt: '',
  notes: '',
  force: false,
});
const rescheduleErrors = ref<Record<string, string>>({});
const reschedulePending = ref(false);

watch(
  () => appointment.value,
  (row) => {
    if (row) {
      rescheduleForm.notes = row.notes ?? '';
      rescheduleForm.date = formatShopDateTime(row.startsAt, 'yyyy-MM-dd');
    }
  },
  { immediate: true },
);

const slotsQuery = useQuery({
  queryKey: computed(
    () =>
      [
        'availability',
        appointment.value?.barberId,
        rescheduleForm.date,
        appointment.value?.serviceId,
      ] as const,
  ),
  queryFn: () =>
    getAvailability(appointment.value!.barberId, {
      date: rescheduleForm.date,
      serviceId: appointment.value!.serviceId,
    }),
  enabled: computed(
    () =>
      rescheduleOpen.value &&
      Boolean(appointment.value?.barberId) &&
      Boolean(appointment.value?.serviceId) &&
      Boolean(rescheduleForm.date),
  ),
});

const { isLoading: slotsLoading } = slotsQuery;

const slotOptions = computed(() =>
  (slotsQuery.data.value?.slots ?? []).map((iso) => ({
    label: formatShopDateTime(iso, 'HH:mm'),
    value: iso,
  })),
);

watch(slotOptions, (options) => {
  if (!options.some((o) => o.value === rescheduleForm.startsAt)) {
    rescheduleForm.startsAt = options[0]?.value ?? '';
  }
});

function openReschedule(): void {
  rescheduleErrors.value = {};
  rescheduleForm.force = false;
  rescheduleOpen.value = true;
}

async function submitReschedule(): Promise<void> {
  rescheduleErrors.value = {};
  const parsed = rescheduleSchema.safeParse(rescheduleForm);
  if (!parsed.success) {
    rescheduleErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  reschedulePending.value = true;
  try {
    await rescheduleAppointment(id.value, {
      startsAt: parsed.data.startsAt,
      notes: parsed.data.notes.trim() === '' ? null : parsed.data.notes.trim(),
      force: isStaff.value ? parsed.data.force : undefined,
    });
    toast.add({
      message: 'Horário reagendado. Status voltou para Agendado.',
      severity: 'success',
    });
    rescheduleOpen.value = false;
    await invalidateAll();
  } catch (error) {
    toast.add({
      message: error instanceof ApiError ? messageForApiError(error) : 'Falha ao reagendar.',
      severity: 'failure',
    });
  } finally {
    reschedulePending.value = false;
  }
}

const ownerHint = computed(() => {
  if (!appointment.value || !auth.user) return null;
  if (isClient.value && appointment.value.clientId !== auth.user.id) {
    return 'Este horário não é seu.';
  }
  return null;
});
</script>

<template>
  <PageLayout>
    <template #title>
      <div class="detail__title">
        <PageBackLink :to="backTo" label="Voltar" />
        <BText as="h1" variant="heading-1">Horário</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="detailPending" height="240px" />

    <BEmptyState
      v-else-if="detailFailed"
      title="Horário não encontrado"
      subtitle="Ele pode ter sido removido ou você não tem acesso."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push(backTo)">Voltar</BButton>
      </template>
    </BEmptyState>

    <template v-else-if="appointment">
      <BText v-if="ownerHint" as="p" variant="body-2" class="detail__error">
        {{ ownerHint }}
      </BText>

      <SectionCard title="Resumo">
        <dl class="detail__grid">
          <div>
            <dt>Status</dt>
            <dd>
              <BLabel :color="APPOINTMENT_STATUS_COLORS[appointment.status]">
                {{ APPOINTMENT_STATUS_LABELS[appointment.status] }}
              </BLabel>
            </dd>
          </div>
          <div>
            <dt>Quando</dt>
            <dd>
              {{ formatShopDateTime(appointment.startsAt) }}
              –
              {{ formatShopDateTime(appointment.endsAt, 'HH:mm') }}
            </dd>
          </div>
          <div>
            <dt>Barbeiro</dt>
            <dd>{{ barberName }}</dd>
          </div>
          <div v-if="canOpenClient">
            <dt>Cliente</dt>
            <dd>
              <RouterLink :to="`/clients/${appointment.clientId}`" class="detail__link">
                Ver ficha
              </RouterLink>
            </dd>
          </div>
          <div>
            <dt>Serviço</dt>
            <dd>{{ serviceName }} · {{ appointment.durationMinutes }} min</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{{ formatMoney(appointment.priceCents) }}</dd>
          </div>
          <div v-if="appointment.notes">
            <dt>Observações</dt>
            <dd>{{ appointment.notes }}</dd>
          </div>
          <div v-if="appointment.cancelledReason">
            <dt>Motivo do cancelamento</dt>
            <dd>{{ appointment.cancelledReason }}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard v-if="!isClient" title="Pagamentos">
        <BSkeletonLoader v-if="paymentsLoading" height="80px" />
        <BEmptyState
          v-else-if="payments.length === 0"
          title="Nenhum pagamento"
          subtitle="Ainda não há recebimentos neste horário."
        />
        <ul v-else class="detail__payments">
          <li v-for="row in payments" :key="row.id" :class="{ 'detail__payments--voided': row.voidedAt }">
            <div>
              <BText as="span" variant="body-2-bold">
                {{ formatMoney(row.amountCents) }} · {{ PAYMENT_METHOD_LABELS[row.method] }}
              </BText>
              <BText as="span" variant="body-3" color="b-fg-neutral-secondary">
                {{ formatShopDateTime(row.paidAt) }}
                <template v-if="row.cardFeeCents > 0">
                  · taxa {{ formatMoney(row.cardFeeCents) }} · líquido
                  {{ formatMoney(row.netAmountCents) }}
                </template>
              </BText>
            </div>
            <BLabel v-if="row.voidedAt" color="grayLight">Estornado</BLabel>
          </li>
        </ul>
        <BText
          v-if="appointment && payments.length > 0"
          as="p"
          variant="body-3"
          color="b-fg-neutral-secondary"
          class="detail__paid"
        >
          Pago {{ formatMoney(paidCents) }} de {{ formatMoney(appointment.priceCents) }}
          · resta {{ formatMoney(remainingCents) }}
        </BText>
      </SectionCard>

      <BText
        v-if="clientBlocked"
        as="p"
        variant="body-2"
        color="b-fg-neutral-secondary"
        class="detail__policy"
      >
        Faltam menos de {{ cancellationWindowHours() }}h para o horário. Para cancelar ou
        remarcar, ligue para a barbearia.
      </BText>

      <div class="detail__actions">
        <RouterLink v-if="canCollectPayment" :to="`/appointments/${id}/pay`">
          <BButton color="neutral" variant="contain">
            Receber · {{ formatMoney(remainingCents) }}
          </BButton>
        </RouterLink>
        <BButton
          v-if="actions.includes('confirm')"
          color="neutral"
          variant="outline"
          :is-loading="actionPending"
          @click="runConfirm"
        >
          Confirmar
        </BButton>
        <BButton
          v-if="actions.includes('complete')"
          color="neutral"
          variant="contain"
          :is-loading="actionPending"
          @click="runComplete"
        >
          Concluir
        </BButton>
        <BButton
          v-if="actions.includes('no_show')"
          color="danger"
          variant="outline"
          :is-loading="actionPending"
          @click="runNoShow"
        >
          Não compareceu
        </BButton>
        <BButton
          v-if="actions.includes('reschedule')"
          color="neutral"
          variant="outline"
          @click="openReschedule"
        >
          Remarcar
        </BButton>
        <BButton
          v-if="actions.includes('cancel')"
          color="danger"
          variant="outline"
          @click="openCancel"
        >
          Cancelar
        </BButton>
      </div>
    </template>

    <BDialog
      :is-open="cancelOpen"
      title-text="Cancelar horário"
      width="420px"
      @update:is-open="cancelOpen = $event"
    >
      <BInputArea
        v-model="cancelForm.reason"
        label="Motivo"
        :label-prepend-asterisk="isStaff"
        :helper-text="cancelErrors.reason"
        rows="3"
      />
      <template #footer>
        <BButton variant="outline" color="neutral" @click="cancelOpen = false">Fechar</BButton>
        <BButton
          color="danger"
          variant="contain"
          :is-loading="cancelPending"
          @click="submitCancel"
        >
          Confirmar cancelamento
        </BButton>
      </template>
    </BDialog>

    <BDialog
      :is-open="rescheduleOpen"
      title-text="Remarcar"
      width="480px"
      @update:is-open="rescheduleOpen = $event"
    >
      <div class="detail__reschedule">
        <BInput
          v-model="rescheduleForm.date"
          type="date"
          label="Data"
          label-prepend-asterisk
          :helper-text="rescheduleErrors.date"
        />
        <BSelect
          v-model="rescheduleForm.startsAt"
          label="Horário"
          label-prepend-asterisk
          :options="slotOptions"
          :helper-text="
            rescheduleErrors.startsAt ||
            (slotsLoading
              ? 'Carregando horários…'
              : slotOptions.length === 0
                ? 'Nenhum horário livre neste dia'
                : undefined)
          "
          :is-disabled="slotOptions.length === 0"
        />
        <BInputArea v-model="rescheduleForm.notes" label="Observações" rows="2" />
        <label v-if="isStaff" class="detail__force">
          <input v-model="rescheduleForm.force" type="checkbox" />
          Forçar fora da grade (nunca sobrepõe outro horário)
        </label>
      </div>
      <template #footer>
        <BButton variant="outline" color="neutral" @click="rescheduleOpen = false">Fechar</BButton>
        <BButton
          color="neutral"
          variant="contain"
          :is-loading="reschedulePending"
          :is-disabled="!rescheduleForm.startsAt && !rescheduleForm.force"
          @click="submitReschedule"
        >
          Salvar
        </BButton>
      </template>
    </BDialog>
  </PageLayout>
</template>

<style scoped>
.detail__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detail__grid {
  display: grid;
  gap: 1rem;
  margin: 0;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .detail__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.detail__grid dt {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.detail__grid dd {
  margin: 0;
}

.detail__link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.detail__payments {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail__payments li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: flex-start;
}

.detail__payments li > div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detail__payments--voided {
  opacity: 0.65;
}

.detail__paid {
  margin-top: 0.75rem;
}

.detail__policy {
  margin-top: 1rem;
}

.detail__error {
  color: var(--b-fg-danger-hover, #b42318);
  margin-bottom: 1rem;
}

.detail__reschedule {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail__force {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.875rem;
}
</style>
