import { describe, expect, it } from 'vitest';
import {
  createStaffSchema,
  fieldErrorsFromZod,
  registerSchema,
  updateSelfSchema,
} from '@/features/users/schemas';

describe('registerSchema', () => {
  it('accepts a valid payload and normalizes email', () => {
    const parsed = registerSchema.parse({
      name: ' Ana ',
      email: 'Ana@Shop.COM',
      phone: '',
      password: 'password1',
    });
    expect(parsed.email).toBe('ana@shop.com');
    expect(parsed.name).toBe('Ana');
  });

  it('rejects short passwords', () => {
    const result = registerSchema.safeParse({
      name: 'Ana',
      email: 'ana@shop.com',
      phone: '',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsFromZod(result.error).password).toMatch(/8/);
    }
  });
});

describe('updateSelfSchema', () => {
  it('requires current password when setting a new one', () => {
    const result = updateSelfSchema.safeParse({
      name: 'Ana',
      phone: '',
      newPassword: 'password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsFromZod(result.error).currentPassword).toBeTruthy();
    }
  });

  it('allows profile update without password fields', () => {
    const parsed = updateSelfSchema.parse({
      name: 'Ana',
      phone: '+5511999999999',
    });
    expect(parsed.name).toBe('Ana');
  });
});

describe('createStaffSchema', () => {
  it('rejects ADMIN role', () => {
    const result = createStaffSchema.safeParse({
      name: 'João',
      email: 'joao@shop.com',
      phone: '',
      password: 'password1',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('accepts MANAGER and BARBER', () => {
    expect(
      createStaffSchema.parse({
        name: 'João',
        email: 'joao@shop.com',
        phone: '',
        password: 'password1',
        role: 'BARBER',
      }).role,
    ).toBe('BARBER');
  });
});
