<script setup lang="ts">
import {
  BButton,
  BEmptyState,
  BInput,
  BSkeletonLoader,
  BSwitch,
  BText,
  useBToast,
} from '@barber/bcomponents';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBarber, getSchedule, replaceSchedule, type ScheduleDayInput } from '@/api/barbers';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import {
  replaceScheduleSchema,
  scheduleFieldErrorsFromZod,
  type ScheduleDayForm,
} from '@/features/barbers/schemas';
import { WEEKDAY_LABELS, toHhMm } from '@/features/barbers/weekdays';
import { ApiError, messageForApiError } from '@/lib/errors';

function emptyWeek(): ScheduleDayForm[] {
  return WEEKDAY_LABELS.map((_, weekday) => ({
    weekday,
    enabled: false,
    startTime: '09:00',
    endTime: '18:00',
    hasBreak: false,
    breakStart: '12:00',
    breakEnd: '13:00',
  }));
}

const route = useRoute();
const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();

const barberId = computed(() => String(route.params.id));

const barberQuery = useQuery({
  queryKey: computed(() => ['barbers', barberId.value] as const),
  queryFn: () => getBarber(barberId.value),
});

const barberName = computed(() => barberQuery.data.value?.displayName ?? 'Barbeiro');

const scheduleQuery = useQuery({
  queryKey: computed(() => ['barbers', barberId.value, 'schedule'] as const),
  queryFn: () => getSchedule(barberId.value),
});

const { isPending: schedulePending, isError: scheduleFailed } = scheduleQuery;

const days = reactive<ScheduleDayForm[]>(emptyWeek());

watch(
  () => scheduleQuery.data.value,
  (schedule) => {
    const next = emptyWeek();
    for (const day of schedule ?? []) {
      const row = next[day.weekday];
      if (!row) continue;
      row.enabled = true;
      row.startTime = toHhMm(day.startTime);
      row.endTime = toHhMm(day.endTime);
      row.hasBreak = Boolean(day.breakStart && day.breakEnd);
      row.breakStart = toHhMm(day.breakStart) || '12:00';
      row.breakEnd = toHhMm(day.breakEnd) || '13:00';
    }
    days.splice(0, days.length, ...next);
  },
  { immediate: true },
);

const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

function dayError(index: number, field: string): string | undefined {
  return fieldErrors.value[`days.${index}.${field}`];
}

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = replaceScheduleSchema.safeParse({ days });
  if (!parsed.success) {
    fieldErrors.value = scheduleFieldErrorsFromZod(parsed.error);
    return;
  }

  const payload: ScheduleDayInput[] = parsed.data.days
    .filter((day) => day.enabled)
    .map((day) => ({
      weekday: day.weekday,
      startTime: day.startTime,
      endTime: day.endTime,
      breakStart: day.hasBreak ? day.breakStart : null,
      breakEnd: day.hasBreak ? day.breakEnd : null,
    }));

  pending.value = true;
  try {
    await replaceSchedule(barberId.value, payload);
    await queryClient.invalidateQueries({
      queryKey: ['barbers', barberId.value, 'schedule'],
    });
    toast.add({ message: 'Horário salvo.', severity: 'success' });
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
  <PageLayout
    subtitle="Dias sem horário ficam fechados. O intervalo de almoço é opcional."
  >
    <template #title>
      <div class="schedule__title">
        <PageBackLink :to="`/barbers/${barberId}`" :label="barberName" />
        <BText as="h1" variant="heading-1">Horário semanal</BText>
      </div>
    </template>

    <BSkeletonLoader v-if="schedulePending" height="320px" />

    <BEmptyState
      v-else-if="scheduleFailed"
      title="Não foi possível carregar o horário"
      subtitle="Tente novamente em instantes."
    >
      <template #actions>
        <BButton color="neutral" @click="router.push(`/barbers/${barberId}`)">Voltar</BButton>
      </template>
    </BEmptyState>

    <form v-else class="schedule__form" @submit.prevent="onSubmit">
      <SectionCard title="Semana">
        <div class="schedule__days">
          <div v-for="(day, index) in days" :key="day.weekday" class="schedule__day">
            <div class="schedule__day-head">
              <BSwitch v-model="day.enabled" :label="WEEKDAY_LABELS[day.weekday]" />
            </div>

            <div v-if="day.enabled" class="schedule__day-fields">
              <BInput
                v-model="day.startTime"
                label="Início"
                placeholder="09:00"
                :helper-text="dayError(index, 'startTime')"
              />
              <BInput
                v-model="day.endTime"
                label="Fim"
                placeholder="18:00"
                :helper-text="dayError(index, 'endTime')"
              />
              <div class="schedule__break-toggle">
                <BSwitch v-model="day.hasBreak" label="Intervalo" />
              </div>
              <template v-if="day.hasBreak">
                <BInput
                  v-model="day.breakStart"
                  label="Início do intervalo"
                  placeholder="12:00"
                  :helper-text="dayError(index, 'breakStart')"
                />
                <BInput
                  v-model="day.breakEnd"
                  label="Fim do intervalo"
                  placeholder="13:00"
                  :helper-text="dayError(index, 'breakEnd')"
                />
              </template>
            </div>
          </div>
        </div>
      </SectionCard>

      <p v-if="formError" class="schedule__error" role="alert">{{ formError }}</p>

      <div class="schedule__actions">
        <BButton
          type="button"
          variant="outline"
          color="neutral"
          @click="router.push(`/barbers/${barberId}`)"
        >
          Cancelar
        </BButton>
        <BButton type="submit" color="neutral" :is-loading="pending" :is-disabled="pending">
          Salvar semana
        </BButton>
      </div>
    </form>
  </PageLayout>
</template>

<style scoped>
.schedule__title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
}

.schedule__form {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
}

.schedule__days {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-md);
}

.schedule__day {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-xs);
  padding-bottom: var(--b-spacing-md);
  border-bottom: 1px solid var(--b-stroke-default);
}

.schedule__day:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.schedule__day-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--b-spacing-2xs) var(--b-spacing-sm);
}

.schedule__break-toggle {
  display: flex;
  align-items: flex-end;
  min-height: 64px;
}

.schedule__error {
  color: var(--b-fg-danger-default);
  font-size: 14px;
}

.schedule__actions {
  display: flex;
  gap: var(--b-spacing-xs);
}
</style>
