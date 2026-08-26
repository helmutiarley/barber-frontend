<script setup lang="ts">
import { computed, useId, useSlots } from 'vue';
import BField from './BField.vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    placeholder?: string;
    helperText?: string;
    isDisabled?: boolean | null;
    labelPrependAsterisk?: boolean;
    optionalText?: string;
    rows?: string | number;
    visibleTextRowCount?: string | number;
  }>(),
  {
    modelValue: '',
    label: undefined,
    placeholder: undefined,
    helperText: undefined,
    isDisabled: false,
    labelPrependAsterisk: false,
    optionalText: undefined,
    rows: undefined,
    visibleTextRowCount: undefined,
  },
);

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const slots = useSlots();
const inputId = useId();

const rowCount = computed(() => Number(props.rows ?? props.visibleTextRowCount ?? 3));

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
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
    <textarea
      :id="inputId"
      class="b-input-area"
      :class="{ 'b-input-area--invalid': Boolean(helperText) }"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="Boolean(isDisabled)"
      :rows="rowCount"
      :aria-invalid="helperText ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="onInput"
    />

    <div v-if="slots.footer" class="b-input-area__footer">
      <slot name="footer" />
    </div>
  </BField>
</template>

<style scoped>
.b-input-area {
  width: 100%;
  padding: var(--b-spacing-2xs) var(--b-spacing-xs);
  background: var(--b-bg-neutral-default);
  border: 1px solid var(--b-border-neutral-secondary);
  border-radius: var(--b-border-radius-sm);
  color: var(--b-fg-neutral-default);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  resize: vertical;
  transition:
    border-color var(--b-transition),
    box-shadow var(--b-transition);
}

.b-input-area::placeholder {
  color: var(--b-fg-neutral-tertiary);
}

.b-input-area:focus {
  outline: none;
  border-color: var(--b-color-brand-500);
  box-shadow: 0 0 0 3px var(--b-color-brand-50);
}

.b-input-area:disabled {
  background: var(--b-bg-neutral-secondary);
  color: var(--b-fg-neutral-secondary);
  cursor: not-allowed;
}

.b-input-area--invalid {
  border-color: var(--b-border-danger-default);
}

.b-input-area__footer {
  margin-top: var(--b-spacing-3xs);
}
</style>
