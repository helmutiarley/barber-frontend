import { apiRequest } from '@/api/client';
import type { AuthResult, UserDto } from '@/api/types';

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

export function login(email: string, password: string): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      ...(input.phone ? { phone: input.phone } : {}),
    },
    skipAuth: true,
  });
}

export function refresh(refreshToken: string): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
  });
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}

export function getMe(): Promise<UserDto> {
  return apiRequest<UserDto>('/users/me');
}
