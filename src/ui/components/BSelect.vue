<script setup lang="ts">
import { useId } from 'vue';
import type { BSelectOption } from '../types';
import BField from './BField.vue';
import BIcon from './BIcon.vue';

withDefaults(
  defineProps<{
    modelValue?: string | null;
    options?: BSelectOption[];
    label?: string;
    placeholder?: string;
    helperText?: string;
    isDisabled?: boolean | null;
    labelPrependAsterisk?: boolean;
    optionalText?: string;
  }>(),
  {
    modelValue: '',
    options: () => [],
    label: undefined,
    placeholder: 'Selecione',
    helperText: undefined,
    isDisabled: false,
    labelPrependAsterisk: false,
    optionalText: undefined,
  },
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const inputId = useId();

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <BField
    v-slot="{ describedBy }"
    :input-id="inputId"
    :label="label"
    :label-prepend-asterisk="labelPrependAsterisk"
    :optional-text="optionalText"
    :helper-text="helperText"
  >
    <div class="b-select" :class="{ 'b-select--disabled': Boolean(isDisabled) }">
      <select
        :id="inputId"
        class="b-select__control"
        :class="{ 'b-select__control--invalid': Boolean(helperText) }"
        :value="modelValue ?? ''"
        :disabled="Boolean(isDisabled)"
        :aria-invalid="helperText ? 'true' : undefined"
        :aria-describedby="describedBy"
        @change="onChange"
      >
        <option value="" disabled>{{ placeholder }}</option>

        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <BIcon name="ic-arrow-left" dimensions="16px" class="b-select__caret" />
    </div>
  </BField>
</template>

<style scoped>
.b-select {
  position: relative;
  display: flex;
  align-items: center;
}

.b-select__control {
  width: 100%;
  padding: var(--b-spacing-2xs) var(--b-spacing-xl) var(--b-spacing-2xs) var(--b-spacing-xs);
  min-height: 40px;
  appearance: none;
  background: var(--b-bg-neutral-default);
  border: 1px solid var(--b-border-neutral-secondary);
  border-radius: var(--b-border-radius-sm);
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  cursor: pointer;
  transition:
    border-color var(--b-transition),
    box-shadow var(--b-transition);
}

.b-select__control:focus {
  outline: none;
  border-color: var(--b-color-brand-500);
  box-shadow: 0 0 0 3px var(--b-color-brand-50);
}

.b-select__control:disabled {
  background: var(--b-bg-neutral-secondary);
  color: var(--b-fg-neutral-secondary);
  cursor: not-allowed;
}

.b-select__control--invalid {
  border-color: var(--b-border-danger-default);
}

.b-select__caret {
  position: absolute;
  right: var(--b-spacing-xs);
  color: var(--b-fg-neutral-secondary);
  pointer-events: none;
  transform: rotate(-90deg);
}

.b-select--disabled .b-select__caret {
  opacity: 0.5;
}
</style>
