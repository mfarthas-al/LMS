import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CREATABLE_ROLES,
  type AdminCreateUserInput,
  type AdminCreateUserResponse,
  type AdminListUsersInput,
  type AdminUserRow,
  type Paginated,
  type Role,
} from '@lms/shared';
import { isUniqueViolation } from '../../common/prisma-errors';
import type { RequestUser } from '../../common/types/request-user';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { SessionService } from '../auth/session.service';
import { UsersService } from '../users/users.service';

const withCreator = { createdBy: { select: { id: true, name: true } } } as const;

/**
 * Admin-only operations. Account management rules:
 * - SUPER_ADMIN manages ADMIN, TEACHER and STUDENT accounts; ADMIN manages TEACHER and STUDENT accounts.
 * - New accounts get a one-time temporary password and must change it at first sign-in.
 * - Nobody can manage SUPER_ADMIN accounts or their own account from here.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
  ) {}

  async listUsers(actor: RequestUser, query: AdminListUsersInput): Promise<Paginated<AdminUserRow>> {
    const visibleRoles = CREATABLE_ROLES[actor.role];
    if (query.role && !visibleRoles.includes(query.role)) {
      throw new ForbiddenException({ code: 'ROLE_NOT_ALLOWED', message: 'You cannot view these accounts' });
    }
    const where: Prisma.UserWhereInput = {
      role: query.role ? query.role : { in: [...visibleRoles] },
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: withCreator,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { items: rows.map((u) => this.users.toAdminRow(u)), total, page: query.page, pageSize: query.pageSize };
  }

  async createUser(actor: RequestUser, input: AdminCreateUserInput, ip?: string): Promise<AdminCreateUserResponse> {
    this.assertCanManage(actor, input.role);
    const temporaryPassword = this.passwords.generateTemporary();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            role: input.role,
            passwordHash,
            mustChangePassword: true,
            createdById: actor.id,
          },
          include: withCreator,
        });
        await this.audit.log(
          {
            action: 'user.created',
            actorId: actor.id,
            targetType: 'User',
            targetId: created.id,
            metadata: { role: created.role },
            ip,
          },
          tx,
        );
        return created;
      });
      return { user: this.users.toAdminRow(user), temporaryPassword };
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException({ code: 'EMAIL_IN_USE', message: 'An account with this email already exists' });
      }
      throw err;
    }
  }

  async setStatus(actor: RequestUser, userId: string, isActive: boolean, ip?: string): Promise<AdminUserRow> {
    const target = await this.findManageable(actor, userId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id: target.id }, data: { isActive }, include: withCreator });
      if (!isActive) await this.sessions.revokeAllForUser(target.id, undefined, tx);
      await this.audit.log(
        {
          action: isActive ? 'user.activated' : 'user.deactivated',
          actorId: actor.id,
          targetType: 'User',
          targetId: target.id,
          ip,
        },
        tx,
      );
      return u;
    });
    return this.users.toAdminRow(updated);
  }

  /** Issues a new temporary password. This is how forgotten passwords are recovered. */
  async resetPassword(actor: RequestUser, userId: string, ip?: string): Promise<AdminCreateUserResponse> {
    const target = await this.findManageable(actor, userId);
    const temporaryPassword = this.passwords.generateTemporary();
    const passwordHash = await this.passwords.hash(temporaryPassword);
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: target.id },
        data: { passwordHash, mustChangePassword: true, passwordChangedAt: new Date() },
        include: withCreator,
      });
      await this.sessions.revokeAllForUser(target.id, undefined, tx);
      await this.audit.log(
        { action: 'user.password_reset_by_admin', actorId: actor.id, targetType: 'User', targetId: target.id, ip },
        tx,
      );
      return u;
    });
    return { user: this.users.toAdminRow(updated), temporaryPassword };
  }

  private async findManageable(actor: RequestUser, userId: string) {
    if (userId === actor.id) {
      throw new BadRequestException({ code: 'CANNOT_MANAGE_SELF', message: 'You cannot change your own account here' });
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    this.assertCanManage(actor, target.role);
    return target;
  }

  private assertCanManage(actor: RequestUser, role: Role) {
    if (!CREATABLE_ROLES[actor.role].includes(role)) {
      throw new ForbiddenException({
        code: 'ROLE_NOT_ALLOWED',
        message: `${actor.role} accounts cannot manage ${role} accounts`,
      });
    }
  }
}
