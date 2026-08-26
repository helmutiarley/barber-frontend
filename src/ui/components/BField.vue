<script setup lang="ts">
withDefaults(
  defineProps<{
    inputId: string;
    label?: string;
    labelPrependAsterisk?: boolean;
    optionalText?: string;
    helperText?: string;
  }>(),
  {
    label: undefined,
    labelPrependAsterisk: false,
    optionalText: undefined,
    helperText: undefined,
  },
);
</script>

<template>
  <div class="b-field">
    <label v-if="label" class="b-field__label" :for="inputId">
      <span v-if="labelPrependAsterisk" class="b-field__asterisk" aria-hidden="true">*</span>
      {{ label }}
      <span v-if="optionalText" class="b-field__optional">{{ optionalText }}</span>
    </label>

    <slot :described-by="helperText ? `${inputId}-helper` : undefined" />

    <p v-if="helperText" :id="`${inputId}-helper`" class="b-field__helper" role="alert">
      {{ helperText }}
    </p>
  </div>
</template>

<style scoped>
.b-field {
  display: flex;
  flex-direction: column;
  gap: var(--b-spacing-2xs);
  width: 100%;
  min-width: 0;
}

.b-field__label {
  display: inline-flex;
  align-items: center;
  gap: var(--b-spacing-3xs);
  padding-left: 2px;
  color: var(--b-input-label-color);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-2);
  line-height: var(--b-line-height-body-2);
  font-weight: var(--b-font-weight-body-2);
  letter-spacing: var(--b-letter-spacing-body-2);
}

.b-field__asterisk {
  color: var(--b-fg-danger-default);
}

.b-field__optional {
  color: var(--b-input-label-optional-color);
}

.b-field__helper {
  margin: 0;
  padding-left: 2px;
  color: var(--b-input-helper-text-error-color);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-caption);
  line-height: var(--b-line-height-caption);
  font-weight: var(--b-font-weight-caption);
  letter-spacing: var(--b-letter-spacing-caption);
}
</style>
