import { ApiError, messageForApiError } from '@/lib/errors';

const DRAWER_CLOSED = /cash register session is open/i;
const NO_COMMISSION_RULE = /no commission rule configured/i;

export type CompletionToast = {
  message: string;
  severity: 'warning' | 'failure';
};

/**
 * Completion answers 409 for two very different reasons, and the server says
 * which in English — translate before the toast turns one into the other.
 */
export function completionErrorToast(error: unknown): CompletionToast {
  if (!(error instanceof ApiError)) {
    return { message: 'Falha ao concluir.', severity: 'failure' };
  }

  if (DRAWER_CLOSED.test(error.message)) {
    return { message: 'Abra o caixa para concluir atendimentos.', severity: 'warning' };
  }

  if (NO_COMMISSION_RULE.test(error.message)) {
    return {
      message: 'Não há regra de comissão para este barbeiro/serviço. Configure em Comissões.',
      severity: 'warning',
    };
  }

  return { message: messageForApiError(error), severity: 'failure' };
}
