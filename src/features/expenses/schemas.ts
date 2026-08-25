import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';
import { parseMoneyInput } from '@/lib/money';

const description = z.string().trim().min(1, 'Informe a descrição').max(200, 'Descrição muito longa');

const category = z.enum(
  ['rent', 'utilities', 'supplies', 'products', 'salaries', 'maintenance', 'other'],
  { errorMap: () => ({ message: 'Escolha a categoria' }) },
);

const kind = z.enum(['fixed', 'variable'], {
  errorMap: () => ({ message: 'Escolha o tipo' }),
});

const paymentMethod = z.enum(['cash', 'pix', 'debit', 'credit'], {
  errorMap: () => ({ message: 'Escolha a forma' }),
});

/** Empty string clears; otherwise a calendar date. */
const dueDate = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Use AAAA-MM-DD',
  });

const amountText = z
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

export const createExpenseSchema = z
  .object({
    description,
    category,
    kind,
    amountText,
    dueDate,
    recurring: z.boolean(),
    payNow: z.boolean(),
    paymentMethod: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.payNow && !paymentMethod.safeParse(data.paymentMethod).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escolha a forma de pagamento',
        path: ['paymentMethod'],
      });
    }
  });

/** Pending rows edit everything; paid rows only description and category. */
export const updateExpenseSchema = z.object({
  description,
  category,
  kind,
  amountText,
  dueDate,
  recurring: z.boolean(),
});

export const updatePaidExpenseSchema = z.object({
  description,
  category,
});

export const payExpenseSchema = z.object({
  paymentMethod,
});

export type CreateExpenseForm = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseForm = z.infer<typeof updateExpenseSchema>;

export { fieldErrorsFromZod };

/** Format cents for a money input (`4500` → `45,00`). */
export function centsToMoneyInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
