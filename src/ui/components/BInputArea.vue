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
    <div
      class="b-input-area__border"
      :class="{
        'b-input-area__border--error': Boolean(helperText),
        'b-input-area__border--disabled': Boolean(props.isDisabled),
      }"
    >
      <textarea
        :id="inputId"
        class="b-input-area__field"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :disabled="Boolean(isDisabled)"
        :rows="rowCount"
        :aria-invalid="helperText ? 'true' : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
      />
    </div>

    <div v-if="slots.footer" class="b-input-area__footer">
      <slot name="footer" />
    </div>
  </BField>
</template>

<style scoped>
.b-input-area__border {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--b-spacing-2xs);
  width: 100%;
  padding-block: 7px;
  padding-inline: var(--b-spacing-sm);
  border: none;
  border-radius: var(--b-border-radius-md);
  background-color: var(--b-border-background-color);
  box-shadow: 0 0 0 1px var(--b-border-border-color);
}

.b-input-area__border:focus-within {
  box-shadow: 0 0 0 2px var(--b-border-focus-color);
}

.b-input-area__border--error,
.b-input-area__border--error:focus-within {
  box-shadow: 0 0 0 2px var(--b-border-error-color);
}

.b-input-area__border--disabled {
  background-color: var(--b-border-disabled-background-color);
  box-shadow: 0 0 0 1px var(--b-border-disabled-color);
  cursor: not-allowed;
}

.b-input-area__field {
  width: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: none;
  resize: none;
  overflow: hidden auto;
  color: var(--b-input-area-color);
  font-family: var(--b-font-family);
  font-size: var(--b-input-area-font-size);
  line-height: var(--b-input-area-line-height);
  font-weight: var(--b-input-area-font-weight);
  letter-spacing: var(--b-input-area-letter-spacing);
}

.b-input-area__field::placeholder {
  color: var(--b-input-area-placeholder-color);
}

.b-input-area__field:disabled {
  color: var(--b-input-area-disabled-color);
  cursor: not-allowed;
}

.b-input-area__footer {
  margin-top: var(--b-spacing-3xs);
}
</style>
