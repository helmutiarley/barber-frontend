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
  width: 100%;
  height: 40px;
  border-radius: var(--b-border-radius-md);
  background-color: var(--b-border-background-color);
  box-shadow: 0 0 0 1px var(--b-border-border-color);
}

.b-select:focus-within {
  box-shadow: 0 0 0 2px var(--b-border-focus-color);
}

.b-select--disabled {
  background-color: var(--b-border-disabled-background-color);
  box-shadow: 0 0 0 1px var(--b-border-disabled-color);
  cursor: not-allowed;
}

.b-select__control {
  width: 100%;
  height: 100%;
  padding-inline: var(--b-spacing-xs) var(--b-spacing-xl);
  appearance: none;
  border: none;
  border-radius: var(--b-border-radius-md);
  outline: none;
  background: none;
  color: var(--b-input-color);
  font-family: var(--b-font-family);
  font-size: var(--b-input-font-size);
  line-height: var(--b-input-line-height);
  font-weight: var(--b-input-font-weight);
  letter-spacing: var(--b-input-letter-spacing);
  text-overflow: ellipsis;
  cursor: pointer;
}

.b-select__control:disabled {
  color: var(--b-input-disabled-color);
  cursor: not-allowed;
}

.b-select:has(.b-select__control--invalid),
.b-select:has(.b-select__control--invalid):focus-within {
  box-shadow: 0 0 0 2px var(--b-border-error-color);
}

.b-select__caret {
  position: absolute;
  right: var(--b-spacing-xs);
  color: var(--b-fg-neutral-secondary);
  pointer-events: none;
  transform: rotate(-90deg);
}

.b-select--disabled .b-select__caret {
  color: var(--b-input-disabled-color);
}
</style>
