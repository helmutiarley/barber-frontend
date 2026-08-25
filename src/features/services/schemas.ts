import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';
import { parseMoneyInput } from '@/lib/money';

const name = z.string().trim().min(1, 'Informe o nome').max(120);

const description = z
  .string()
  .trim()
  .refine((value) => value === '' || value.length <= 1000, {
    message: 'Descrição muito longa',
  });

const durationMinutes = z.coerce
  .number({ invalid_type_error: 'Informe a duração' })
  .int('Use minutos inteiros')
  .positive('A duração deve ser positiva')
  .max(600, 'No máximo 600 minutos');

/** Money typed as a free-form string, converted to integer cents. */
const priceText = z
  .string()
  .trim()
  .min(1, 'Informe o preço')
  .superRefine((value, ctx) => {
    try {
      const cents = parseMoneyInput(value);
      if (cents <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'O preço deve ser positivo' });
      }
      if (cents > 100_000_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Preço acima do limite' });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Preço inválido' });
    }
  })
  .transform((value) => parseMoneyInput(value));

export const createServiceSchema = z.object({
  name,
  description,
  priceText,
  durationMinutes,
});

export const updateServiceSchema = z.object({
  name,
  description,
  priceText,
  durationMinutes,
});

export type CreateServiceForm = z.infer<typeof createServiceSchema>;
export type UpdateServiceForm = z.infer<typeof updateServiceSchema>;

export { fieldErrorsFromZod };

/** Format cents for a money input (`4500` → `45,00`). */
export function centsToMoneyInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
