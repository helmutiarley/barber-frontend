<script setup lang="ts">
import { useId } from 'vue';
import BField from './BField.vue';

const props = withDefaults(
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
    <div
      class="b-input-border"
      :class="{
        'b-input-border--error': Boolean(helperText),
        'b-input-border--disabled': Boolean(props.isDisabled),
      }"
    >
      <div class="b-input__content">
        <input
          :id="inputId"
          class="b-input__field"
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
      </div>
    </div>
  </BField>
</template>

<style scoped>
.b-input-border {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--b-spacing-2xs);
  width: 100%;
  height: 40px;
  padding-inline: var(--b-spacing-xs);
  border: none;
  border-radius: var(--b-border-radius-md);
  background-color: var(--b-border-background-color);
  box-shadow: 0 0 0 1px var(--b-border-border-color);
}

.b-input-border:focus-within {
  box-shadow: 0 0 0 2px var(--b-border-focus-color);
}

.b-input-border--error,
.b-input-border--error:focus-within {
  box-shadow: 0 0 0 2px var(--b-border-error-color);
}

.b-input-border--disabled {
  background-color: var(--b-border-disabled-background-color);
  box-shadow: 0 0 0 1px var(--b-border-disabled-color);
  cursor: not-allowed;
}

.b-input__content {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.b-input__field {
  width: 100%;
  height: 90%;
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
}

.b-input__field::placeholder {
  color: var(--b-input-placeholder-color);
}

.b-input__field:disabled {
  color: var(--b-input-disabled-color);
  cursor: not-allowed;
}

.b-input__field[type='number'] {
  appearance: textfield;
}

.b-input__field[type='number']::-webkit-outer-spin-button,
.b-input__field[type='number']::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
</style>
