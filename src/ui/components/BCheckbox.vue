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
  <div class="b-checkbox">
    <input
      :id="inputId"
      class="b-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      :disabled="Boolean(disabled)"
      @change="onChange"
    />

    <label v-if="label" class="b-checkbox__label" :for="inputId">{{ label }}</label>
  </div>
</template>

<style scoped>
.b-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
}

.b-checkbox__input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--b-color-brand-500);
  cursor: pointer;
}

.b-checkbox__input:disabled {
  cursor: not-allowed;
}

.b-checkbox__label {
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  color: var(--b-fg-neutral-default);
  cursor: pointer;
}

.b-checkbox__input:disabled + .b-checkbox__label {
  color: var(--b-fg-neutral-secondary);
  cursor: not-allowed;
}
</style>
