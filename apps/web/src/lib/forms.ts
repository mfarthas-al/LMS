import { ApiError } from '@lms/api-client';
import type { z, ZodTypeAny } from 'zod';

export type FieldErrors = Record<string, string | undefined>;

/** Validates with the same zod schema the API uses. Returns parsed data or per-field messages. */
export function validate<S extends ZodTypeAny>(
  schema: S,
  values: unknown,
): { data?: z.output<S>; errors: FieldErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: {} };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_form');
    errors[key] ??= issue.message;
  }
  return { errors };
}

/** Turns an API failure into a form-level message plus any per-field messages. */
export function apiErrors(err: unknown): { message: string; fields: FieldErrors } {
  if (err instanceof ApiError) {
    const fields: FieldErrors = {};
    for (const [k, v] of Object.entries(err.fieldErrors)) fields[k] = v[0];
    if (err.status === 429 && !err.message.startsWith('Too many') && !err.message.startsWith('Please wait')) {
      return { message: 'Too many attempts. Please wait a minute and try again.', fields };
    }
    return { message: err.message, fields };
  }
  return { message: 'Could not reach the server. Check your connection and try again.', fields: {} };
}
