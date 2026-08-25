import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';
import { parseMoneyInput } from '@/lib/money';

const name = z.string().trim().min(1, 'Informe o nome').max(120, 'Nome muito longo');

const description = z
  .string()
  .trim()
  .refine((value) => value.length <= 500, { message: 'Descrição muito longa' });

/** Money typed as a free-form string, converted to integer cents. */
const priceText = z
  .string()
  .trim()
  .min(1, 'Informe o preço')
  .superRefine((value, ctx) => {
    try {
      const cents = parseMoneyInput(value);
      if (cents <= 0) {
        // A free product is a giveaway, not a catalog row.
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

/** Empty means "not tracked"; the API takes `null`. */
const costText = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value === '') return;
    try {
      const cents = parseMoneyInput(value);
      if (cents < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Custo inválido' });
      }
      if (cents > 100_000_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Custo acima do limite' });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Custo inválido' });
    }
  })
  .transform((value) => (value === '' ? null : parseMoneyInput(value)));

const count = z.coerce
  .number({ invalid_type_error: 'Informe um número' })
  .int('Use unidades inteiras')
  .min(0, 'Não pode ser negativo')
  .max(1_000_000, 'Acima do limite');

export const createProductSchema = z.object({
  name,
  description,
  priceText,
  costText,
  stockQuantity: count,
  lowStockThreshold: count,
});

/** `stockQuantity` is absent: the API answers 400 for it, and stock has its own form. */
export const updateProductSchema = z.object({
  name,
  description,
  priceText,
  costText,
  lowStockThreshold: count,
});

export const adjustStockSchema = z
  .object({
    reason: z.enum(['purchase', 'loss', 'correction'], {
      errorMap: () => ({ message: 'Escolha o motivo' }),
    }),
    /** Unsigned in the form; the direction is a separate choice. */
    quantity: z.coerce
      .number({ invalid_type_error: 'Informe a quantidade' })
      .int('Use unidades inteiras')
      .positive('A quantidade deve ser positiva')
      .max(1_000_000, 'Acima do limite'),
    direction: z.enum(['in', 'out']),
    notes: z.string().trim().max(200, 'Observação muito longa'),
    /** Passed in so the "would go below zero" check is testable without the API. */
    stockQuantity: z.number().int(),
  })
  .superRefine((data, ctx) => {
    if (data.direction === 'out' && data.quantity > data.stockQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Há apenas ${data.stockQuantity} em estoque`,
        path: ['quantity'],
      });
    }
  });

export const sellProductsSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1, 'Escolha o produto'),
        quantity: z.coerce
          .number({ invalid_type_error: 'Informe a quantidade' })
          .int('Use unidades inteiras')
          .positive('A quantidade deve ser positiva')
          .max(10_000, 'Acima do limite'),
      }),
    )
    .min(1, 'Adicione ao menos um item')
    .max(50, 'No máximo 50 itens'),
  method: z.enum(['cash', 'pix', 'debit', 'credit'], {
    errorMap: () => ({ message: 'Escolha a forma' }),
  }),
  soldByBarberId: z.string().trim(),
  clientId: z.string().trim(),
});

export const voidSaleSchema = z.object({
  reason: z.string().trim().max(200, 'Motivo muito longo'),
});

export type CreateProductForm = z.infer<typeof createProductSchema>;
export type UpdateProductForm = z.infer<typeof updateProductSchema>;
export type AdjustStockForm = z.infer<typeof adjustStockSchema>;
export type SellProductsForm = z.infer<typeof sellProductsSchema>;

export { fieldErrorsFromZod };

/** Format cents for a money input (`4500` → `45,00`). */
export function centsToMoneyInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** The signed delta the API wants, from the form's unsigned pair. */
export function signedDelta(direction: 'in' | 'out', quantity: number): number {
  return direction === 'in' ? quantity : -quantity;
}
