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
  <label class="b-switch">
    <button
      class="b-switch__track"
      :class="{ 'b-switch__track--on': modelValue }"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :disabled="Boolean(disabled)"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span class="b-switch__thumb" />
    </button>

    <span v-if="label" class="b-switch__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.b-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  cursor: pointer;
}

.b-switch__track {
  position: relative;
  width: 40px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: var(--b-border-radius-full);
  background: var(--b-color-neutral-300);
  cursor: pointer;
  transition: background-color var(--b-transition);
}

.b-switch__track--on {
  background: var(--b-color-brand-500);
}

.b-switch__track:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.b-switch__track:focus-visible {
  outline: 2px solid var(--b-fg-brand-default);
  outline-offset: 2px;
}

.b-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: var(--b-border-radius-full);
  background: var(--b-color-neutral-0);
  transition: transform var(--b-transition);
}

.b-switch__track--on .b-switch__thumb {
  transform: translateX(18px);
}

.b-switch__label {
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  color: var(--b-fg-neutral-default);
}
</style>
