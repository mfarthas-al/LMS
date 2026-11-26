export const PAYMENT_METHODS = ['ONLINE', 'MANUAL'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  'PENDING',
  'PENDING_REVIEW',
  'SUCCESS',
  'FAILED',
  'REJECTED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Allowed bank slip uploads. */
export const SLIP_MAX_BYTES = 5 * 1024 * 1024;
export const SLIP_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
