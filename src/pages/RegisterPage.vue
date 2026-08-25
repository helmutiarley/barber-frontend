<script setup lang="ts">
import { BButton, BInput, useBToast } from '@barber/bcomponents';
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { ApiError, messageForApiError } from '@/lib/errors';
import { homePathForRole } from '@/lib/roles';
import { fieldErrorsFromZod, registerSchema } from '@/features/users/schemas';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const toast = useBToast();

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
});
const fieldErrors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);
const pending = ref(false);

async function onSubmit(): Promise<void> {
  formError.value = null;
  fieldErrors.value = {};

  const parsed = registerSchema.safeParse(form);
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error);
    return;
  }

  pending.value = true;
  try {
    const phone = parsed.data.phone.trim();
    await auth.register({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      ...(phone ? { phone } : {}),
    });
    toast.add({ message: 'Conta criada com sucesso.', severity: 'success' });
    await router.replace(homePathForRole(auth.role!));
  } catch (error) {
    const message =
      error instanceof ApiError ? messageForApiError(error) : 'Não foi possível criar a conta.';
    formError.value = message;
    toast.add({ message, severity: 'failure' });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <form class="register" @submit.prevent="onSubmit">
    <h1 class="register__title">Criar conta</h1>
    <p class="register__hint">Cadastro de cliente para agendar horários.</p>

    <BInput
      v-model="form.name"
      label="Nome"
      placeholder="Seu nome"
      autocomplete="name"
      label-prepend-asterisk
      :helper-text="fieldErrors.name"
    />
    <BInput
      v-model="form.email"
      type="email"
      label="Email"
      placeholder="voce@email.com"
      autocomplete="email"
      label-prepend-asterisk
      :helper-text="fieldErrors.email"
    />
    <BInput
      v-model="form.phone"
      type="tel"
      label="Telefone"
      placeholder="+5511999999999"
      autocomplete="tel"
      optional-text="opcional"
      :helper-text="fieldErrors.phone"
    />
    <BInput
      v-model="form.password"
      type="password"
      label="Senha"
      placeholder="Mínimo 8 caracteres"
      autocomplete="new-password"
      label-prepend-asterisk
      :helper-text="fieldErrors.password"
    />

    <p v-if="formError" class="register__error" role="alert">{{ formError }}</p>

    <BButton type="submit" color="primary" full-width :is-loading="pending" :is-disabled="pending">
      Criar conta
    </BButton>

    <p class="register__footer">
      Já tem conta?
      <RouterLink to="/login" class="register__link">Entrar</RouterLink>
    </p>
  </form>
</template>

<style scoped>
.register {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.register__title {
  font-size: 1.25rem;
  font-weight: 650;
  margin-bottom: 0.25rem;
}

.register__hint {
  font-size: 0.875rem;
  color: var(--b-fg-neutral-secondary, #666);
  margin-bottom: 1rem;
}

.register__error {
  color: #b91c1c;
  font-size: 0.875rem;
  margin: 0.5rem 0 0.75rem;
}

.register__footer {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--b-fg-neutral-secondary, #666);
}

.register__link {
  color: var(--b-fg-brand-primary, #1d4ed8);
  font-weight: 600;
  text-decoration: underline;
}
</style>
