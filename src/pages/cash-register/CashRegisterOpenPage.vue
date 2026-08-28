<script setup lang="ts">
import { BButton, BInput, BText, useBToast } from '@/ui';
import { useQueryClient } from '@tanstack/vue-query';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { openSession } from '@/api/cash-register';
import PageBackLink from '@/components/layout/PageBackLink.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import SectionCard from '@/components/layout/SectionCard.vue';
import { fieldErrorsFromZod, openSessionSchema } from '@/features/cash-register/schemas';
import { ApiError, messageForApiError } from '@/lib/errors';
import { useCashRegisterStore } from '@/stores/cash-register';

const router = useRouter();
const toast = useBToast();
const queryClient = useQueryClient();
const cash = useCashRegisterStore();

const form = reactive({ openingBalanceText: '0,00' });
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = openSessionSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    await openSession({ openingBalanceCents: parsed.data.openingBalanceText });
    toast.add({ message: 'Caixa aberto.', severity: 'success' });
    await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    await cash.refresh();
    await router.push('/cash-register');
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível abrir.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PageLayout subtitle="Informe o dinheiro contado na gaveta agora.">
    <template #title>
      <div class="open__title">
        <PageBackLink to="/cash-register" label="Caixa" />
        <BText as="h1" variant="heading-1">Abrir caixa</BText>
      </div>
    </template>

    <form class="open__form" @submit.prevent="onSubmit">
      <SectionCard title="Saldo de abertura">
        <BInput
          v-model="form.openingBalanceText"
          label="Valor na gaveta"
          placeholder="0,00"
          label-prepend-asterisk
          :helper-text="fieldErrors.openingBalanceText"
        />
      </SectionCard>

      <BText v-if="formError" as="p" variant="body-2" class="open__error" role="alert">
        {{ formError }}
      </BText>

      <BButton type="submit" color="neutral" variant="contain" :is-loading="pending">
        Abrir
      </BButton>
    </form>
  </PageLayout>
</template>

<style scoped>
.open__title {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.open__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 28rem;
}

.open__error {
  color: var(--b-fg-danger-hover, #b42318);
}
</style>
