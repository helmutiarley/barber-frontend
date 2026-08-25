export type ApiErrorFields = Record<string, string[] | string | undefined>;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields?: ApiErrorFields;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    status: number,
    fields?: ApiErrorFields,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.details = details;
  }
}

const FALLBACK_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Email ou senha inválidos.',
  FORBIDDEN: 'Você não tem permissão para isso.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Conflito com o estado atual.',
  VALIDATION_ERROR: 'Dados inválidos.',
  INTERNAL: 'Algo deu errado. Tente de novo.',
};

/** Prefer the server message when present; otherwise a stable pt-BR fallback. */
export function messageForApiError(error: ApiError): string {
  if (error.message && error.code !== 'INTERNAL') {
    return error.message;
  }

  return FALLBACK_MESSAGES[error.code] ?? FALLBACK_MESSAGES.INTERNAL;
}

export type BlockingAppointment = {
  id: string;
  startsAt: string;
};

/** Narrow CONFLICT details from barber/user deactivation. */
export function blockingAppointmentsFromDetails(details: unknown): BlockingAppointment[] {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.filter(
    (item): item is BlockingAppointment =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as BlockingAppointment).id === 'string' &&
      typeof (item as BlockingAppointment).startsAt === 'string',
  );
}

export type ParsedErrorBody = {
  code: string;
  message: string;
  fields?: ApiErrorFields;
  details?: unknown;
};

/** Pure helper for tests and the HTTP client. */
export function parseErrorBody(
  json: unknown,
  status: number,
  fallbackMessage = 'Algo deu errado. Tente de novo.',
): ApiError {
  let code = 'INTERNAL';
  let message = fallbackMessage;
  let fields: ApiErrorFields | undefined;
  let details: unknown;

  if (json && typeof json === 'object' && 'error' in json) {
    const error = (json as { error?: ParsedErrorBody }).error;
    if (error?.code) code = error.code;
    if (error?.message) message = error.message;
    if (error?.fields) fields = error.fields;
    if (error?.details !== undefined) details = error.details;
  }

  return new ApiError(code, message, status, fields, details);
}
