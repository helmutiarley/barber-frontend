import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';

/** Shop-local wall clock `HH:MM` (24h). */
const timeHhMm = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');

const specialtiesFromText = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().min(1).max(40)).max(20));

export const createBarberSchema = z.object({
  userId: z.string().uuid('Selecione um usuário barbeiro'),
  displayName: z.string().trim().min(1, 'Informe o nome de exibição').max(120),
  photoUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().url().safeParse(value).success, {
      message: 'URL inválida',
    }),
  specialtiesText: specialtiesFromText,
});

export const updateBarberSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição').max(120),
  photoUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().url().safeParse(value).success, {
      message: 'URL inválida',
    }),
  specialtiesText: specialtiesFromText,
});

const scheduleDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    hasBreak: z.boolean(),
    breakStart: z.string(),
    breakEnd: z.string(),
  })
  .superRefine((day, ctx) => {
    if (!day.enabled) return;

    for (const [field, value] of [
      ['startTime', day.startTime],
      ['endTime', day.endTime],
    ] as const) {
      if (!timeHhMm.safeParse(value).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use o formato HH:MM',
          path: [field],
        });
      }
    }

    if (timeHhMm.safeParse(day.startTime).success && timeHhMm.safeParse(day.endTime).success) {
      if (day.endTime <= day.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O fim deve ser depois do início',
          path: ['endTime'],
        });
      }
    }

    if (day.hasBreak) {
      for (const [field, value] of [
        ['breakStart', day.breakStart],
        ['breakEnd', day.breakEnd],
      ] as const) {
        if (!timeHhMm.safeParse(value).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Use o formato HH:MM',
            path: [field],
          });
        }
      }

      if (
        timeHhMm.safeParse(day.breakStart).success &&
        timeHhMm.safeParse(day.breakEnd).success &&
        day.breakEnd <= day.breakStart
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O fim do intervalo deve ser depois do início',
          path: ['breakEnd'],
        });
      }
    }
  });

export const replaceScheduleSchema = z.object({
  days: z.array(scheduleDaySchema).length(7),
});

export const createBlockSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
    startTime: timeHhMm,
    endTime: timeHhMm,
    reason: z.string().trim().max(200),
  })
  .superRefine((block, ctx) => {
    if (block.endTime <= block.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O fim deve ser depois do início',
        path: ['endTime'],
      });
    }
  });

export type CreateBarberForm = z.infer<typeof createBarberSchema>;
export type UpdateBarberForm = z.infer<typeof updateBarberSchema>;
export type ScheduleDayForm = z.infer<typeof scheduleDaySchema>;
export type ReplaceScheduleForm = z.infer<typeof replaceScheduleSchema>;
export type CreateBlockForm = z.infer<typeof createBlockSchema>;

export { fieldErrorsFromZod };

/** Nested day field errors keyed as `days.0.startTime` → first segment for the row. */
export function scheduleFieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.');
    if (key && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
