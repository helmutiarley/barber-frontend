<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    disabled?: boolean | null;
  }>(),
  { modelValue: false, label: undefined, disabled: false },
);

const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
</script>

<template>
  <label class="b-switch-container">
    <button
      class="b-switch"
      :class="{ 'b-switch--checked': modelValue, 'b-switch--disabled': Boolean(disabled) }"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :disabled="Boolean(disabled)"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span />
    </button>

    <span
      v-if="label"
      class="b-switch-label"
      :class="{ 'b-switch-label--disabled': Boolean(disabled) }"
    >
      {{ label }}
    </span>
  </label>
</template>

<style scoped>
.b-switch-container {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  min-width: 0;
  max-width: 100%;
}

.b-switch {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  width: 37px;
  height: 22px;
  border: 0;
  border-radius: 14px;
  background: var(--b-switch-color-off);
  overflow: visible;
  cursor: pointer;
  transition: background-color 0.3s;
}

.b-switch--checked {
  background: var(--b-switch-color);
}

.b-switch:focus-visible {
  outline: 2px solid var(--b-switch-color-off);
  outline-offset: 1px;
  border-radius: 14px;
}

.b-switch--checked:focus-visible {
  outline-color: var(--b-switch-color);
}

.b-switch > span {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 22px;
  margin: -1px;
  border: 0;
  border-radius: 50%;
  background: var(--b-switch-bubble);
  overflow: hidden;
  pointer-events: none;
  transform: translate(5%) scale(0.8);
  transition: transform 0.15s;
}

.b-switch--checked > span {
  transform: translate(72%) scale(0.8);
}

.b-switch--disabled {
  background: var(--b-switch-color-disabled);
  pointer-events: none;
  cursor: not-allowed;
}

.b-switch--disabled > span {
  background: var(--b-switch-bubble-disabled);
}

.b-switch-label {
  min-width: 0;
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
  word-break: break-word;
  user-select: none;
  cursor: pointer;
}

.b-switch-label--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
