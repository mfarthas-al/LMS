/**
 * Seeds the super admin account — the only way a SUPER_ADMIN can be created.
 * Reads SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD and SUPER_ADMIN_NAME from .env.
 *
 *   pnpm db:seed
 *
 * Safe to run repeatedly: an existing super admin is left untouched (its password is NOT reset).
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { passwordSchema } from '@lms/shared';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';

  if (!email || !password) {
    throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env before seeding.');
  }
  const strength = passwordSchema.safeParse(password);
  if (!strength.success) {
    throw new Error(`SUPER_ADMIN_PASSWORD is too weak: ${strength.error.issues.map((i) => i.message).join(', ')}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      throw new Error(`${email} already exists with role ${existing.role}; refusing to change it.`);
    }
    console.log(`Super admin ${email} already exists — left unchanged.`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: 'SUPER_ADMIN',
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      passwordChangedAt: new Date(),
      emailVerified: true,
    },
  });
  await prisma.auditLog.create({
    data: { action: 'user.seeded', targetType: 'User', targetId: user.id, metadata: { role: 'SUPER_ADMIN' } },
  });
  console.log(`Created super admin ${email}.`);
}

async function main() {
  await seedSuperAdmin();
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
