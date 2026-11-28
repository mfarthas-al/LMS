import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Prisma, Session, User } from '@prisma/client';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { JwtPayload } from '@lms/shared';
import { durationToMs } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface ClientMeta {
  ip?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTtlMs: number;
  refreshTtlMs: number;
}

/** Within this window, a request with the just-replaced refresh token is treated as a race, not theft. */
const ROTATION_GRACE_MS = 30_000;

/**
 * Device sessions and tokens.
 * - Access token: short-lived JWT (JWT_ACCESS_TTL) carrying the session id.
 * - Refresh token: opaque "<sessionId>.<random>", stored only as a SHA-256 hash, rotated on every use.
 *   Presenting an old refresh token outside the grace window revokes every session of that user.
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly accessTtlMs: number;
  private readonly refreshTtlMs: number;
  private readonly maxStudentDevices: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {
    this.accessTtlMs = durationToMs(config.get<string>('JWT_ACCESS_TTL') ?? '15m');
    this.refreshTtlMs = durationToMs(config.get<string>('JWT_REFRESH_TTL') ?? '30d');
    this.maxStudentDevices = Number(config.get('MAX_ACTIVE_DEVICES_PER_STUDENT') ?? 2);
  }

  /** Starts a new device session (login / register). */
  async create(user: User, meta: ClientMeta): Promise<IssuedTokens> {
    if (user.role === 'STUDENT') await this.enforceDeviceLimit(user.id, meta.ip);

    const secret = randomBytes(32).toString('base64url');
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: sha256(secret),
        deviceName: meta.deviceName ?? null,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });
    return this.issue(user, session, secret);
  }

  /** Swaps a refresh token for a new pair. Throws 401 for anything invalid. */
  async rotate(refreshToken: string, meta: ClientMeta): Promise<{ user: User; tokens: IssuedTokens }> {
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) throw invalidSession();

    const session = await this.prisma.session.findUnique({
      where: { id: parsed.sessionId },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive) {
      throw invalidSession();
    }

    const presented = sha256(parsed.secret);
    if (!safeEqual(presented, session.refreshTokenHash)) {
      const isRecentRace =
        session.previousRefreshTokenHash &&
        safeEqual(presented, session.previousRefreshTokenHash) &&
        session.rotatedAt &&
        Date.now() - session.rotatedAt.getTime() < ROTATION_GRACE_MS;
      if (isRecentRace) {
        // Another tab/request already rotated this token; the client should retry with the new cookie.
        throw new UnauthorizedException({ code: 'REFRESH_RACE', message: 'Session was just refreshed' });
      }
      // An old token is being replayed: assume it was stolen and sign the user out everywhere.
      await this.revokeAllForUser(session.userId);
      await this.audit.log({
        action: 'auth.refresh_token_reuse',
        actorId: session.userId,
        targetType: 'Session',
        targetId: session.id,
        ip: meta.ip,
      });
      this.logger.warn(`Refresh token reuse detected for user ${session.userId}; all sessions revoked`);
      throw invalidSession();
    }

    const secret = randomBytes(32).toString('base64url');
    // Conditional update: only one concurrent rotation of the same token can win.
    const { count } = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: session.refreshTokenHash, revokedAt: null },
      data: {
        refreshTokenHash: sha256(secret),
        previousRefreshTokenHash: session.refreshTokenHash,
        rotatedAt: new Date(),
        lastUsedAt: new Date(),
        ip: meta.ip ?? session.ip,
        userAgent: meta.userAgent?.slice(0, 500) ?? session.userAgent,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });
    if (count === 0) {
      throw new UnauthorizedException({ code: 'REFRESH_RACE', message: 'Session was just refreshed' });
    }
    return { user: session.user, tokens: this.issue(session.user, session, secret) };
  }

  /** Revokes the session a refresh token belongs to (logout). Silently ignores invalid tokens. */
  async revokeByRefreshToken(refreshToken: string | undefined): Promise<string | null> {
    const parsed = refreshToken ? parseRefreshToken(refreshToken) : null;
    if (!parsed) return null;
    const session = await this.prisma.session.findUnique({ where: { id: parsed.sessionId } });
    if (!session || session.revokedAt) return null;
    const presented = sha256(parsed.secret);
    const matches =
      safeEqual(presented, session.refreshTokenHash) ||
      (!!session.previousRefreshTokenHash && safeEqual(presented, session.previousRefreshTokenHash));
    if (!matches) return null;
    await this.revoke(session.id);
    return session.userId;
  }

  revoke(sessionId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? this.prisma).session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllForUser(userId: string, exceptSessionId?: string, tx?: Prisma.TransactionClient) {
    return (tx ?? this.prisma).session.updateMany({
      where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      data: { revokedAt: new Date() },
    });
  }

  listActive(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /** Used by JwtStrategy on every request: the session must still be live and the user active. */
  findLive(sessionId: string, userId: string) {
    return this.prisma.session.findFirst({
      where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } },
      include: { user: true },
    });
  }

  private issue(user: User, session: Session, secret: string): IssuedTokens {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      sid: session.id,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: Math.floor(this.accessTtlMs / 1000),
    });
    return {
      accessToken,
      refreshToken: `${session.id}.${secret}`,
      accessTtlMs: this.accessTtlMs,
      refreshTtlMs: this.refreshTtlMs,
    };
  }

  /** Students may be signed in on at most N devices; the least recently used ones are signed out. */
  private async enforceDeviceLimit(userId: string, ip?: string | null) {
    const active = await this.listActive(userId);
    const excess = active.slice(Math.max(this.maxStudentDevices - 1, 0));
    for (const s of excess) {
      await this.revoke(s.id);
      await this.audit.log({
        action: 'auth.session_evicted',
        actorId: userId,
        targetType: 'Session',
        targetId: s.id,
        metadata: { reason: 'device_limit', limit: this.maxStudentDevices },
        ip,
      });
    }
  }
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function parseRefreshToken(token: string): { sessionId: string; secret: string } | null {
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  return { sessionId: token.slice(0, dot), secret: token.slice(dot + 1) };
}

function invalidSession() {
  return new UnauthorizedException({ code: 'SESSION_INVALID', message: 'Please sign in again' });
}
