import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_PENDING_PASSWORD_CHANGE_KEY } from '../decorators/account-status.decorator';
import type { RequestUser } from '../types/request-user';

/**
 * Global guard, runs after JwtAuthGuard. Accounts created by an admin must replace their
 * temporary password before they can use anything else. Routes needed to do that
 * (/auth/me, /auth/change-password) opt out with @AllowPendingPasswordChange().
 */
@Injectable()
export class AccountStatusGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const user: RequestUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user?.mustChangePassword) return true; // public route, or account is ready

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_CHANGE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (allowed) return true;
    throw new ForbiddenException({
      code: 'PASSWORD_CHANGE_REQUIRED',
      message: 'Change your temporary password to continue',
    });
  }
}
