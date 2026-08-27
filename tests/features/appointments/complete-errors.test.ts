import { describe, expect, it } from 'vitest';
import { completionErrorToast } from '@/features/appointments/complete-errors';
import { ApiError } from '@/lib/errors';

function conflict(message: string): ApiError {
  return new ApiError('CONFLICT', message, 409);
}

describe('completionErrorToast', () => {
  it('points at the register when the drawer is what is missing', () => {
    expect(completionErrorToast(conflict('No cash register session is open'))).toEqual({
      message: 'Abra o caixa para concluir atendimentos.',
      severity: 'warning',
    });
  });

  it('points at commissions when the rule is what is missing', () => {
    const toast = completionErrorToast(
      conflict('No commission rule configured for barber barber-1'),
    );

    expect(toast.severity).toBe('warning');
    expect(toast.message).toMatch(/regra de comissão/);
  });

  it('passes any other conflict through rather than guessing', () => {
    expect(completionErrorToast(conflict('An appointment that is completed cannot become completed'))).toEqual({
      message: 'An appointment that is completed cannot become completed',
      severity: 'failure',
    });
  });

  it('falls back when the failure never reached the API', () => {
    expect(completionErrorToast(new Error('offline'))).toEqual({
      message: 'Falha ao concluir.',
      severity: 'failure',
    });
  });
});
