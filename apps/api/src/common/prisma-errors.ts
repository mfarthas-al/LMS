import { Prisma } from '@prisma/client';

/** True when a write failed because of a unique constraint (e.g. duplicate email). */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
