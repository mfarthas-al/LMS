import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditEntry {
  action: string; // e.g. "auth.login", "user.created"
  actorId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}

/** Append-only log of security-relevant actions. Never store passwords, tokens or OTP codes here. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Best effort: a failed audit write is logged but never breaks the request. */
  async log(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    try {
      await (tx ?? this.prisma).auditLog.create({
        data: {
          action: entry.action,
          actorId: entry.actorId ?? null,
          targetType: entry.targetType,
          targetId: entry.targetId,
          metadata: entry.metadata,
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      if (tx) throw err;
      this.logger.error(`Failed to write audit log "${entry.action}"`, err as Error);
    }
  }
}
