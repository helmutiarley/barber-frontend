import { z } from 'zod';
import { fieldErrorsFromZod } from '@/features/users/schemas';

const uuid = z.string().uuid('Seleção inválida');

const notes = z
  .string()
  .trim()
  .refine((value) => value === '' || value.length <= 1000, {
    message: 'Observação muito longa',
  });

/** Shared book form — reception adds `clientId`; clients omit it. */
export const bookAppointmentSchema = z.object({
  barberId: uuid,
  serviceId: uuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  startsAt: z.string().min(1, 'Escolha um horário'),
  notes,
  force: z.boolean().optional(),
  clientId: z.string().optional(),
});

export type ClientMode = 'existing' | 'walkIn';

export const receptionBookSchema = bookAppointmentSchema
  .extend({
    clientMode: z.enum(['existing', 'walkIn']),
    walkInName: z.string().trim(),
    walkInPhone: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.clientMode === 'existing') {
      if (!z.string().uuid().safeParse(data.clientId).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione o cliente',
          path: ['clientId'],
        });
      }
      return;
    }

    if (data.walkInPhone.replace(/\D/g, '').length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um telefone válido',
        path: ['walkInPhone'],
      });
    }
    if (data.walkInPhone.length > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone muito longo',
        path: ['walkInPhone'],
      });
    }
    if (data.walkInName.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o nome',
        path: ['walkInName'],
      });
    }
  });

export const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  startsAt: z.string().min(1, 'Escolha um horário'),
  notes,
  force: z.boolean().optional(),
});

export const cancelSchema = z.object({
  reason: z.string().trim().min(1, 'Informe o motivo').max(500, 'Motivo muito longo'),
});

/** Client cancel — reason optional. */
export const clientCancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .refine((value) => value === '' || value.length <= 500, {
      message: 'Motivo muito longo',
    }),
});

export type BookAppointmentForm = z.infer<typeof bookAppointmentSchema>;
export type RescheduleForm = z.infer<typeof rescheduleSchema>;
export type CancelForm = z.infer<typeof cancelSchema>;

export { fieldErrorsFromZod };
