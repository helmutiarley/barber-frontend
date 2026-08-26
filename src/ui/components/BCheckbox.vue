<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    disabled?: boolean | null;
  }>(),
  { modelValue: false, label: undefined, disabled: false },
);

const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const inputId = useId();

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <div class="b-checkbox-container">
    <span class="b-checkbox-wrapper">
      <input
        :id="inputId"
        class="b-checkbox"
        :class="{
          'b-checkbox--checked': modelValue,
          'b-checkbox--disabled': Boolean(disabled),
        }"
        type="checkbox"
        :checked="modelValue"
        :disabled="Boolean(disabled)"
        @change="onChange"
      />
    </span>

    <label v-if="label" class="b-checkbox__label" :for="inputId">{{ label }}</label>
  </div>
</template>

<style scoped>
.b-checkbox-container {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  min-width: 0;
  max-width: 100%;
  border-radius: var(--b-border-radius-xs);
}

.b-checkbox-container:has(:focus-visible) {
  outline: 2px solid var(--b-fg-brand-secondary);
}

.b-checkbox-wrapper {
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.b-checkbox {
  position: relative;
  display: block;
  width: 20px;
  height: 20px;
  margin: 0;
  appearance: none;
  border-radius: var(--b-border-radius-xs);
  background-color: transparent;
  box-shadow: inset 0 0 0 2px var(--b-checkbox-primary-border);
  cursor: pointer;
}

.b-checkbox:focus-visible {
  outline: none;
}

.b-checkbox--checked:not(.b-checkbox--disabled) {
  background-color: var(--b-checkbox-primary-bg);
  box-shadow: inset 0 0 0 2px var(--b-checkbox-primary-border);
}

.b-checkbox--checked:not(.b-checkbox--disabled):hover {
  background-color: var(--b-checkbox-primary-bg-hover);
  box-shadow: inset 0 0 0 2px var(--b-checkbox-primary-border-hover);
}

.b-checkbox--checked:not(.b-checkbox--disabled)::after {
  background-color: var(--b-checkbox-primary-checkmark);
}

.b-checkbox--disabled {
  background-color: var(--b-checkbox-disabled-bg);
  box-shadow: inset 0 0 0 2px var(--b-checkbox-disabled-border);
  cursor: not-allowed;
}

.b-checkbox--disabled.b-checkbox--checked::after {
  background-color: var(--b-checkbox-disabled-checkmark);
}

.b-checkbox--checked::after {
  content: '';
  position: absolute;
  inset: 0;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='9' viewBox='0 0 11 9' fill='none'%3E%3Cpath d='M10.5908 1.59082L3.79541 8.38623L0 4.59082L1.59082 3L3.79541 5.20459L9 0L10.5908 1.59082Z' fill='black'/%3E%3C/svg%3E");
  mask-position: 50%;
  mask-repeat: no-repeat;
}

.b-checkbox__label {
  min-width: 0;
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
  word-break: break-word;
  cursor: pointer;
}

.b-checkbox--disabled ~ .b-checkbox__label,
.b-checkbox-wrapper:has(.b-checkbox--disabled) + .b-checkbox__label {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
