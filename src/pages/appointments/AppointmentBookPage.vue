<script setup lang="ts">
import {
  BButton,
  BInput,
  BInputArea,
  BSelect,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createAppointment } from '@/api/appointments';
import { getAvailability, listBarbers } from '@/api/barbers';
import { listClients } from '@/api/clients';
import { listServices } from '@/api/services';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { usePermission } from '@/composables/usePermission';
import {
  bookAppointmentSchema,
  fieldErrorsFromZod,
  receptionBookSchema,
} from '@/features/appointments/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatShopDateTime, shopLocalToUtcIso, shopToday } from '@/lib/shop-time';

const props = withDefaults(
  defineProps<{
    /** Reception booking requires picking a client. */
    mode?: 'client' | 'reception';
  }>(),
  { mode: 'client' },
);

const router = useRouter();
const toast = useBToast();
const { hasRole } = usePermission();

const isReception = computed(
  () => props.mode === 'reception' || hasRole('ADMIN') || hasRole('MANAGER'),
);

const form = reactive({
  clientId: '',
  clientSearch: '',
  serviceId: '',
  barberId: '',
  date: shopToday(),
  startsAt: '',
  forceTime: '09:00',
  notes: '',
  force: false,
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

const servicesQuery = useQuery({
  queryKey: ['services', { includeInactive: false }] as const,
  queryFn: () => listServices(),
});

const barbersQuery = useQuery({
  queryKey: ['barbers', 'public'] as const,
  queryFn: () => listBarbers(),
});

const clientSearchDebounced = ref('');
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => form.clientSearch,
  (value) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      clientSearchDebounced.value = value.trim();
    }, 300);
  },
);

const clientsQuery = useQuery({
  queryKey: computed(() => ['clients', { search: clientSearchDebounced.value }] as const),
  queryFn: () =>
    listClients({
      search: clientSearchDebounced.value || undefined,
      limit: 20,
    }),
  enabled: isReception,
});

// `isLoading`, not `isPending`: a disabled query stays pending forever, so
// `isPending` would leave "Buscando…" on screen even with nothing in flight.
const { isLoading: clientsLoading } = clientsQuery;

const serviceOptions = computed(() =>
  (servicesQuery.data.value ?? []).map((s) => ({
    label: `${s.name} · ${s.durationMinutes} min · ${formatMoney(s.priceCents)}`,
    value: s.id,
  })),
);

const barberOptions = computed(() =>
  (barbersQuery.data.value ?? []).map((b) => ({ label: b.displayName, value: b.id })),
);

const clientOptions = computed(() =>
  (clientsQuery.data.value?.data ?? []).map((c) => ({
    label: `${c.name}${c.phone ? ` · ${c.phone}` : ''}`,
    value: c.id,
  })),
);

watch(
  serviceOptions,
  (options) => {
    if (!form.serviceId && options[0]) form.serviceId = options[0].value;
  },
  { immediate: true },
);

watch(
  barberOptions,
  (options) => {
    if (!form.barberId && options[0]) form.barberId = options[0].value;
  },
  { immediate: true },
);

const availabilityQuery = useQuery({
  queryKey: computed(
    () => ['availability', form.barberId, form.date, form.serviceId] as const,
  ),
  queryFn: () =>
    getAvailability(form.barberId, {
      date: form.date,
      serviceId: form.serviceId,
    }),
  enabled: computed(
    () => Boolean(form.barberId) && Boolean(form.serviceId) && Boolean(form.date),
  ),
});

const { isLoading: availabilityLoading } = availabilityQuery;

const slotOptions = computed(() =>
  (availabilityQuery.data.value?.slots ?? []).map((iso) => ({
    label: formatShopDateTime(iso, 'HH:mm'),
    value: iso,
  })),
);

watch(slotOptions, (options) => {
  if (!options.some((o) => o.value === form.startsAt)) {
    form.startsAt = options[0]?.value ?? '';
  }
});

const backTo = computed(() => (isReception.value ? '/appointments' : '/me/appointments'));

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const startsAt =
    form.force && !form.startsAt
      ? shopLocalToUtcIso(form.date, form.forceTime)
      : form.startsAt;

  const payload = { ...form, startsAt };
  const schema = isReception.value ? receptionBookSchema : bookAppointmentSchema;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const created = await createAppointment({
      barberId: parsed.data.barberId,
      serviceId: parsed.data.serviceId,
      startsAt: parsed.data.startsAt,
      notes: parsed.data.notes.trim() || undefined,
      clientId: isReception.value ? parsed.data.clientId : undefined,
      force: isReception.value ? parsed.data.force : undefined,
    });
    toast.add({ message: 'Horário marcado.', severity: 'success' });
    await router.push(`/appointments/${created.id}`);
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível agendar.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout
    :subtitle="
      isReception
        ? 'Escolha cliente, serviço e um horário livre. Forçar só pula a grade — nunca sobrepõe.'
        : 'Escolha o serviço, o barbeiro e um horário livre.'
    "
  >
    <template #title>
      <div class="book__title">
        <PageBackLink :to="backTo" label="Voltar" />
        <BText as="h1" variant="heading-1">
          {{ isReception ? 'Novo horário' : 'Agendar' }}
        </BText>
      </div>
    </template>

    <form class="book__form" @submit.prevent="onSubmit">
      <SectionCard v-if="isReception" title="Cliente">
        <BInput
          v-model="form.clientSearch"
          label="Buscar"
          placeholder="Nome, email ou telefone"
        />
        <BSelect
          v-model="form.clientId"
          label="Cliente"
          label-prepend-asterisk
          :options="clientOptions"
          :helper-text="
            fieldErrors.clientId ||
            (clientsLoading
              ? 'Buscando…'
              : clientOptions.length === 0
                ? 'Nenhum cliente encontrado — cadastre em Clientes.'
                : undefined)
          "
          :is-disabled="clientOptions.length === 0"
        />
        <BText as="p" variant="body-3" color="b-fg-neutral-secondary">
          Criação de walk-in (nome + telefone) ainda não está nesta tela — use um cliente já
          cadastrado.
        </BText>
      </SectionCard>

      <SectionCard title="Serviço e horário">
        <div class="book__fields">
          <BSelect
            v-model="form.serviceId"
            label="Serviço"
            label-prepend-asterisk
            :options="serviceOptions"
            :helper-text="fieldErrors.serviceId"
          />
          <BSelect
            v-model="form.barberId"
            label="Barbeiro"
            label-prepend-asterisk
            :options="barberOptions"
            :helper-text="fieldErrors.barberId"
          />
          <BInput
            v-model="form.date"
            type="date"
            label="Data"
            label-prepend-asterisk
            :helper-text="fieldErrors.date"
          />
          <BSelect
            v-model="form.startsAt"
            label="Horário"
            label-prepend-asterisk
            :options="slotOptions"
            :helper-text="
              fieldErrors.startsAt ||
              (availabilityLoading
                ? 'Carregando horários…'
                : slotOptions.length === 0
                  ? 'Nenhum horário livre — troque data ou barbeiro'
                  : undefined)
            "
            :is-disabled="slotOptions.length === 0 && !form.force"
          />
          <BInput
            v-if="isReception && form.force && slotOptions.length === 0"
            v-model="form.forceTime"
            label="Horário forçado"
            placeholder="09:00"
            label-prepend-asterisk
          />
          <BInputArea v-model="form.notes" label="Observações" rows="3" />
          <label v-if="isReception" class="book__force">
            <input v-model="form.force" type="checkbox" />
            Forçar fora da grade (nunca sobrepõe outro horário)
          </label>
        </div>
      </SectionCard>

      <BText v-if="formError" as="p" variant="body-2" class="book__error">
        {{ formError }}
      </BText>

      <div class="book__submit">
        <BButton
          type="submit"
          color="neutral"
          variant="contain"
          :is-loading="pending"
          :is-disabled="!form.startsAt && !(form.force && form.forceTime)"
        >
          Confirmar agendamento
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.book__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.book__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.book__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.book__force {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.875rem;
}

.book__error {
  color: var(--b-fg-danger-primary, #b42318);
}

.book__submit {
  display: flex;
  justify-content: flex-start;
}
</style>
