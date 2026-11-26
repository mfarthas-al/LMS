import { z } from 'zod';

/**
 * Sri Lankan mobile numbers. Accepts 0771234567, 771234567, +94771234567 or 94771234567
 * and normalises to E.164 (+94771234567).
 */
export const sriLankaPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^(?:\+?94|0)?7\d{8}$/.test(v), 'Enter a valid Sri Lankan mobile number')
  .transform((v) => `+94${v.slice(-9)}`);

export const requestOtpSchema = z.object({ phone: sriLankaPhoneSchema });
export const verifyOtpSchema = z.object({
  phone: sriLankaPhoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
