import { z } from 'zod';
import { ROLES, SELF_REGISTER_ROLES } from '../constants/roles';

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/\d/, 'Must contain a number');

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email');
const nameSchema = z.string().trim().min(2, 'At least 2 characters').max(100);

/** Public sign-up. Only STUDENT or TEACHER can be chosen here. */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(SELF_REGISTER_ROLES).default('STUDENT'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(128),
  /** Optional label shown in the "active devices" list, e.g. "Pixel 7". */
  deviceName: z.string().trim().max(100).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(128),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  });

/** Mobile sends its refresh token in the body; web uses the httpOnly cookie instead. */
export const refreshSchema = z.object({ refreshToken: z.string().min(1).max(512).optional() });

/** Admin area: create an account. Which roles are allowed is checked server-side (CREATABLE_ROLES). */
export const adminCreateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(ROLES),
});

export const adminListUsersSchema = z.object({
  role: z.enum(ROLES).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminSetUserStatusSchema = z.object({ isActive: z.boolean() });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminListUsersInput = z.infer<typeof adminListUsersSchema>;
