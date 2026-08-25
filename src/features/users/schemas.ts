import { z } from 'zod';
import type { UserRole } from '@/lib/roles';

const email = z.string().trim().toLowerCase().pipe(z.string().email('Email inválido'));
const password = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(200);

/** Empty string is allowed (optional phone). */
const phoneField = z
  .string()
  .trim()
  .refine((value) => value === '' || (value.length >= 8 && value.length <= 20), {
    message: 'Telefone inválido',
  });

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  email,
  phone: phoneField,
  password,
});

export const updateSelfSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(120),
    phone: phoneField,
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const changingPassword = Boolean(data.newPassword && data.newPassword.length > 0);
    if (changingPassword) {
      if (!data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a senha atual',
          path: ['currentPassword'],
        });
      }
      if (!data.newPassword || data.newPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A nova senha deve ter pelo menos 8 caracteres',
          path: ['newPassword'],
        });
      }
    }
  });

export const createStaffSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  email,
  phone: phoneField,
  password,
  role: z.enum(['MANAGER', 'BARBER'], {
    errorMap: () => ({ message: 'Selecione o perfil' }),
  }),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  phone: phoneField,
  role: z.enum(['ADMIN', 'MANAGER', 'BARBER', 'CLIENT'] as [UserRole, ...UserRole[]]),
  active: z.boolean(),
});

export type RegisterForm = z.infer<typeof registerSchema>;
export type UpdateSelfForm = z.infer<typeof updateSelfSchema>;
export type CreateStaffForm = z.infer<typeof createStaffSchema>;
export type UpdateUserForm = z.infer<typeof updateUserSchema>;

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
