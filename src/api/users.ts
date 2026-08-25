import { apiRequest } from '@/api/client';
import type { UserDto } from '@/api/types';
import type { UserRole } from '@/lib/roles';

export type UpdateMeInput = {
  name?: string;
  phone?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

export type CreateStaffInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'MANAGER' | 'BARBER';
};

export type ListUsersQuery = {
  role?: UserRole;
  active?: boolean;
};

export type UpdateUserInput = {
  name?: string;
  phone?: string | null;
  role?: UserRole;
  active?: boolean;
};

export function updateMe(body: UpdateMeInput): Promise<UserDto> {
  return apiRequest<UserDto>('/users/me', {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}

export function listUsers(query: ListUsersQuery = {}): Promise<UserDto[]> {
  const params = new URLSearchParams();
  if (query.role) params.set('role', query.role);
  if (query.active !== undefined) params.set('active', String(query.active));
  const qs = params.toString();
  return apiRequest<UserDto[]>(`/users${qs ? `?${qs}` : ''}`);
}

export function createStaff(body: CreateStaffInput): Promise<UserDto> {
  return apiRequest<UserDto>('/users', {
    method: 'POST',
    body: {
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      ...(body.phone ? { phone: body.phone } : {}),
    },
  });
}

export function updateUser(id: string, body: UpdateUserInput): Promise<UserDto> {
  return apiRequest<UserDto>(`/users/${id}`, {
    method: 'PATCH',
    body: body as Record<string, unknown>,
  });
}
