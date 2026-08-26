<script setup lang="ts">
import { useId } from 'vue';
import BField from './BField.vue';

withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    label?: string;
    placeholder?: string;
    type?: string;
    helperText?: string;
    isDisabled?: boolean | null;
    labelPrependAsterisk?: boolean;
    optionalText?: string;
    autocomplete?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
  }>(),
  {
    modelValue: '',
    label: undefined,
    placeholder: undefined,
    type: 'text',
    helperText: undefined,
    isDisabled: false,
    labelPrependAsterisk: false,
    optionalText: undefined,
    autocomplete: undefined,
    min: undefined,
    max: undefined,
    step: undefined,
  },
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const inputId = useId();

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
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
    <input
      :id="inputId"
      class="b-input"
      :class="{ 'b-input--invalid': Boolean(helperText) }"
      :value="modelValue ?? ''"
      :type="type"
      :placeholder="placeholder"
      :disabled="Boolean(isDisabled)"
      :autocomplete="autocomplete"
      :min="min"
      :max="max"
      :step="step"
      :aria-invalid="helperText ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="onInput"
    />
  </BField>
</template>

<style scoped>
.b-input {
  width: 100%;
  padding: var(--b-spacing-2xs) var(--b-spacing-xs);
  min-height: 40px;
  background: var(--b-bg-neutral-default);
  border: 1px solid var(--b-border-neutral-secondary);
  border-radius: var(--b-border-radius-sm);
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  transition:
    border-color var(--b-transition),
    box-shadow var(--b-transition);
}

.b-input::placeholder {
  color: var(--b-fg-neutral-tertiary);
}

.b-input:focus {
  outline: none;
  border-color: var(--b-color-brand-500);
  box-shadow: 0 0 0 3px var(--b-color-brand-50);
}

.b-input:disabled {
  background: var(--b-bg-neutral-secondary);
  color: var(--b-fg-neutral-secondary);
  cursor: not-allowed;
}

.b-input--invalid {
  border-color: var(--b-border-danger-default);
}

.b-input--invalid:focus {
  box-shadow: 0 0 0 3px var(--b-color-danger-50);
}
</style>
