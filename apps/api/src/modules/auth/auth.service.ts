import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import type { ChangePasswordInput, LoginInput, RegisterInput, SessionInfo } from '@lms/shared';
import type Redis from 'ioredis';
import { isUniqueViolation } from '../../common/prisma-errors';
import { PrismaService } from '../../database/prisma.service';
import { REDIS } from '../../database/redis.module';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { SessionService, type ClientMeta, type IssuedTokens } from './session.service';

/** Wrong passwords allowed per account before sign-in is locked for LOGIN_LOCKOUT_SECONDS. */
const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCKOUT_SECONDS = 15 * 60;

/**
 * Email + password authentication.
 * - Self sign-up is limited to STUDENT and TEACHER (registerSchema); admins are created in AdminModule,
 *   the super admin only by the seed script.
 * - Self-registered accounts are active immediately; there is no approval or phone verification step.
 * - Forgotten passwords are reset by an admin (AdminService.resetPassword issues a temporary password).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async register(
    input: RegisterInput,
    meta: ClientMeta,
  ): Promise<{ user: User; tokens: IssuedTokens }> {
    const passwordHash = await this.passwords.hash(input.password);
    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          passwordHash,
          passwordChangedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException({
          code: 'EMAIL_IN_USE',
          message: 'An account with this email already exists',
        });
      }
      throw err;
    }
    const [tokens] = await Promise.all([
      this.sessions.create(user, meta),
      this.audit.log({
        action: 'auth.register',
        actorId: user.id,
        targetType: 'User',
        targetId: user.id,
        metadata: { role: user.role },
        ip: meta.ip,
      }),
    ]);
    return { user, tokens };
  }

  async login(input: LoginInput, meta: ClientMeta): Promise<{ user: User; tokens: IssuedTokens }> {
    // Per-account lockout (the per-IP limit is kept loose because schools and mobile
    // networks put many students behind one IP address).
    const failKey = `login:fail:${input.email}`;
    const failures = Number((await this.redis.get(failKey)) ?? 0);
    if (failures >= MAX_LOGIN_FAILURES) {
      const retryAfter = Math.max(await this.redis.ttl(failKey), 1);
      throw new HttpException(
        {
          code: 'TOO_MANY_ATTEMPTS',
          message: `Too many failed sign-in attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
          retryAfterSeconds: retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.users.findByEmail(input.email);
    const ok = await this.passwords.verify(user?.passwordHash, input.password);
    if (!user || !ok) {
      await this.redis.multi().incr(failKey).expire(failKey, LOGIN_LOCKOUT_SECONDS).exec();
      await this.audit.log({
        action: 'auth.login_failed',
        actorId: user?.id ?? null,
        metadata: { email: input.email },
        ip: meta.ip,
      });
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DISABLED',
        message: 'This account has been disabled',
      });
    }

    // Independent writes run together instead of one after another.
    const lastLoginAt = new Date();
    const [tokens] = await Promise.all([
      this.sessions.create(user, meta),
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt } }),
      this.redis.del(failKey),
      this.audit.log({ action: 'auth.login', actorId: user.id, ip: meta.ip }),
    ]);
    return { user: { ...user, lastLoginAt }, tokens };
  }

  refresh(refreshToken: string | undefined, meta: ClientMeta) {
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'SESSION_INVALID', message: 'Please sign in again' });
    }
    return this.sessions.rotate(refreshToken, meta);
  }

  async logout(refreshToken: string | undefined, meta: ClientMeta) {
    const userId = await this.sessions.revokeByRefreshToken(refreshToken);
    if (userId) await this.audit.log({ action: 'auth.logout', actorId: userId, ip: meta.ip });
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException();
    return user;
  }

  /** Also used to replace an admin-issued temporary password. Signs out every other device. */
  async changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
    meta: ClientMeta,
  ) {
    const user = await this.me(userId);
    if (!(await this.passwords.verify(user.passwordHash, input.currentPassword))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Current password is incorrect',
      });
    }
    const passwordHash = await this.passwords.hash(input.newPassword);
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false, passwordChangedAt: new Date() },
      });
      await this.sessions.revokeAllForUser(userId, sessionId, tx);
      await this.audit.log({ action: 'auth.password_changed', actorId: userId, ip: meta.ip }, tx);
      return u;
    });
    return updated;
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessions = await this.sessions.listActive(userId);
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      ip: s.ip,
      lastUsedAt: s.lastUsedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      current: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, meta: ClientMeta) {
    const { count } = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0)
      throw new NotFoundException({ code: 'SESSION_NOT_FOUND', message: 'Session not found' });
    await this.audit.log({
      action: 'auth.session_revoked',
      actorId: userId,
      targetType: 'Session',
      targetId: sessionId,
      ip: meta.ip,
    });
  }
}
