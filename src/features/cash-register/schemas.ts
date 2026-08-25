import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';
import { parseMoneyInput } from '@/lib/money';

const moneyNonNegative = z
  .string()
  .trim()
  .min(1, 'Informe o valor')
  .superRefine((value, ctx) => {
    try {
      const cents = parseMoneyInput(value);
      if (cents < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor inválido' });
      }
      if (cents > 100_000_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor acima do limite' });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor inválido' });
    }
  })
  .transform((value) => parseMoneyInput(value));

const moneyPositive = z
  .string()
  .trim()
  .min(1, 'Informe o valor')
  .superRefine((value, ctx) => {
    try {
      const cents = parseMoneyInput(value);
      if (cents <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O valor deve ser positivo' });
      }
      if (cents > 100_000_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor acima do limite' });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor inválido' });
    }
  })
  .transform((value) => parseMoneyInput(value));

export const openSessionSchema = z.object({
  openingBalanceText: moneyNonNegative,
});

export const closeSessionSchema = z.object({
  countedBalanceText: moneyNonNegative,
  notes: z.string().trim(),
  expectedBalanceCents: z.number().int(),
});

export const closeSessionFormSchema = closeSessionSchema.superRefine((data, ctx) => {
  const counted = data.countedBalanceText;
  const difference = counted - data.expectedBalanceCents;
  if (difference !== 0 && data.notes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Explique a diferença entre contado e esperado',
      path: ['notes'],
    });
  }
});

export const manualMovementSchema = z.object({
  kind: z.enum(['deposit', 'withdrawal', 'adjustment_in', 'adjustment_out'], {
    errorMap: () => ({ message: 'Escolha o tipo' }),
  }),
  amountText: moneyPositive,
  description: z.string().trim().min(1, 'Informe a descrição').max(500, 'Descrição muito longa'),
});

export type OpenSessionForm = z.infer<typeof openSessionSchema>;
export type CloseSessionForm = z.infer<typeof closeSessionFormSchema>;
export type ManualMovementForm = z.infer<typeof manualMovementSchema>;

export { fieldErrorsFromZod };
