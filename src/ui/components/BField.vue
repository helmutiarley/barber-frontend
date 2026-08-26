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
  gap: var(--b-spacing-3xs);
  min-width: 0;
}

.b-field__label {
  display: inline-flex;
  align-items: baseline;
  gap: var(--b-spacing-4xs);
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-3);
  line-height: var(--b-line-height-body-3);
  font-weight: var(--b-font-weight-medium);
  color: var(--b-fg-neutral-default);
}

.b-field__asterisk {
  color: var(--b-fg-danger-default);
}

.b-field__optional {
  font-weight: var(--b-font-weight-regular);
  color: var(--b-fg-neutral-secondary);
}

.b-field__helper {
  margin: 0;
  font-family: var(--b-font-family);
  font-size: var(--b-font-size-body-3);
  line-height: var(--b-line-height-body-3);
  color: var(--b-fg-danger-default);
}
</style>
