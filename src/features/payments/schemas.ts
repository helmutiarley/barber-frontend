import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';
import { parseMoneyInput } from '@/lib/money';

const moneyText = z
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

const method = z.enum(['cash', 'pix', 'debit', 'credit'], {
  errorMap: () => ({ message: 'Escolha a forma' }),
});

export const paymentLineSchema = z.object({
  method,
  amountText: moneyText,
});

export const recordPaymentsFormSchema = z
  .object({
    lines: z.array(paymentLineSchema).min(1, 'Adicione ao menos um pagamento').max(4),
  })
  .superRefine((data, ctx) => {
    const total = data.lines.reduce((sum, line) => sum + line.amountText, 0);
    if (total <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um valor positivo',
        path: ['lines'],
      });
    }
  });

export const voidPaymentSchema = z.object({
  reason: z.string().trim().min(1, 'Informe o motivo').max(500, 'Motivo muito longo'),
});

export type PaymentLineForm = z.infer<typeof paymentLineSchema>;
export type RecordPaymentsForm = z.infer<typeof recordPaymentsFormSchema>;

export { fieldErrorsFromZod };
