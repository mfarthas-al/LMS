import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { AdminUserRow, AuthUser } from '@lms/shared';
import { PrismaService } from '../../database/prisma.service';

/** User profiles (student / teacher / admin / super admin). */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  /** Safe public shape of the signed-in user. Never includes the password hash. */
  toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  }

  toAdminRow(user: User & { createdBy?: { id: string; name: string } | null }): AdminUserRow {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      createdBy: user.createdBy ? { id: user.createdBy.id, name: user.createdBy.name } : null,
    };
  }
}
