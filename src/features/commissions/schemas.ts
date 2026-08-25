import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';
import { fitsPercentScale, parsePercentInput, percentToRate } from '@/features/commissions/rate';
import { parseMoneyInput } from '@/lib/money';

const base = z.enum(['gross', 'net'], { errorMap: () => ({ message: 'Escolha a base' }) });

const appliesTo = z.enum(['services', 'products'], {
  errorMap: () => ({ message: 'Escolha o alvo' }),
});

const paymentMethod = z.enum(['cash', 'pix', 'debit', 'credit'], {
  errorMap: () => ({ message: 'Escolha a forma' }),
});

/** Typed as a percentage, sent as the fraction the API stores. */
const ratePercent = z
  .string()
  .trim()
  .min(1, 'Informe o percentual')
  .superRefine((value, ctx) => {
    let percent: number;
    try {
      percent = parsePercentInput(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percentual inválido' });
      return;
    }

    if (percent < 0 || percent > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use um valor entre 0 e 100' });
    }
    if (!fitsPercentScale(percent)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No máximo duas casas decimais' });
    }
  })
  .transform((value) => percentToRate(parsePercentInput(value)));

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

const calendarDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use AAAA-MM-DD');

/** Empty string is the wildcard the API expresses as `null`. */
const optionalId = z.string().trim();

export const createRuleSchema = z
  .object({
    barberId: optionalId,
    serviceId: optionalId,
    ratePercent,
    base,
    appliesTo,
  })
  .superRefine((data, ctx) => {
    if (data.appliesTo === 'products' && data.serviceId !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Regras de produto não têm serviço',
        path: ['serviceId'],
      });
    }
  });

/** Scope is immutable: only the rate and the base can be corrected in place. */
export const updateRuleSchema = z.object({
  ratePercent,
  base,
});

export const recordAdvanceSchema = z.object({
  barberId: z.string().trim().min(1, 'Escolha o barbeiro'),
  amountText: moneyPositive,
  paymentMethod,
  notes: z.string().trim().max(500, 'Observação muito longa'),
});

export const payPeriodSchema = z.object({
  paymentMethod,
});

/**
 * `today` is passed in rather than read from the clock, so the rule that a range
 * must be over before it can be closed is testable without mocking time.
 */
export const closePeriodSchema = z
  .object({
    barberId: optionalId,
    startsOn: calendarDate,
    endsOn: calendarDate,
    today: calendarDate,
  })
  .superRefine((data, ctx) => {
    if (data.endsOn < data.startsOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O fim não pode ser antes do início',
        path: ['endsOn'],
      });
    }
    if (data.endsOn >= data.today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Só dá para fechar um período que já terminou',
        path: ['endsOn'],
      });
    }
  });

export type CreateRuleForm = z.infer<typeof createRuleSchema>;
export type UpdateRuleForm = z.infer<typeof updateRuleSchema>;
export type RecordAdvanceForm = z.infer<typeof recordAdvanceSchema>;
export type ClosePeriodForm = z.infer<typeof closePeriodSchema>;

export { fieldErrorsFromZod };
