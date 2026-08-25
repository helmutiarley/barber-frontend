<script setup lang="ts">
import { BButton, BCard, BText } from '@barber/bcomponents';
import { computed } from 'vue';
import {
  formatRange,
  presetForRange,
  RANGE_PRESET_LABELS,
  RANGE_PRESETS,
  rangeError,
  rangeForPreset,
  type RangePreset,
  type ReportRange,
} from '@/features/reports/range';

const props = defineProps<{ range: ReportRange }>();
const emit = defineEmits<{ (event: 'update:range', range: ReportRange): void }>();

const error = computed(() => rangeError(props.range));
const activePreset = computed(() => presetForRange(props.range));

const from = computed({
  get: () => props.range.from,
  set: (value: string) => emit('update:range', { ...props.range, from: value }),
});

const to = computed({
  get: () => props.range.to,
  set: (value: string) => emit('update:range', { ...props.range, to: value }),
});

function applyPreset(preset: RangePreset): void {
  emit('update:range', rangeForPreset(preset));
}
</script>

<template>
  <BCard class="range">
    <div class="range__row">
      <label class="range__field">
        <span>De</span>
        <input v-model="from" type="date" class="range__date" />
      </label>
      <label class="range__field">
        <span>Até</span>
        <input v-model="to" type="date" class="range__date" />
      </label>
      <div class="range__presets">
        <BButton
          v-for="preset in RANGE_PRESETS"
          :key="preset"
          size="small"
          color="neutral"
          :variant="activePreset === preset ? 'contain' : 'outline'"
          @click="applyPreset(preset)"
        >
          {{ RANGE_PRESET_LABELS[preset] }}
        </BButton>
      </div>
    </div>

    <BText v-if="error" as="p" variant="body-3" class="range__error">{{ error }}</BText>
    <BText v-else as="p" variant="body-3" color="b-fg-neutral-secondary" class="range__summary">
      {{ formatRange(range) }} · dias inteiros no fuso da barbearia.
    </BText>
  </BCard>
</template>

<style scoped>
.range__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.range__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: var(--b-fg-neutral-secondary, #667085);
}

.range__date {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--b-border-neutral-primary, #d0d5dd);
  border-radius: 0.5rem;
  background: var(--b-bg-neutral-primary, #fff);
  color: inherit;
  font: inherit;
}

.range__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-left: auto;
}

.range__error {
  margin-top: 0.75rem;
  color: var(--b-fg-danger-primary, #b42318);
}

.range__summary {
  margin-top: 0.75rem;
}
</style>
