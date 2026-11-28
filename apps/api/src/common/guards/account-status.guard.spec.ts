import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@lms/shared';
import { ALLOW_PENDING_PASSWORD_CHANGE_KEY } from '../decorators/account-status.decorator';
import type { RequestUser } from '../types/request-user';
import { AccountStatusGuard } from './account-status.guard';

function ctx(user?: Partial<RequestUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guard(allowed: string[] = []) {
  const reflector = { getAllAndOverride: (key: string) => allowed.includes(key) } as unknown as Reflector;
  return new AccountStatusGuard(reflector);
}

const user = (role: Role, mustChangePassword = false): Partial<RequestUser> => ({
  id: 'u1',
  role,
  mustChangePassword,
  sessionId: 's1',
});

describe('AccountStatusGuard', () => {
  it('lets public (unauthenticated) requests through', () => {
    expect(guard().canActivate(ctx(undefined))).toBe(true);
  });

  it.each<Role>(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'])('allows a ready %s account', (role) => {
    expect(guard().canActivate(ctx(user(role)))).toBe(true);
  });

  it.each<Role>(['STUDENT', 'TEACHER', 'ADMIN'])('blocks a %s with a temporary password', (role) => {
    try {
      guard().canActivate(ctx(user(role, true)));
      throw new Error('expected guard to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(((err as ForbiddenException).getResponse() as { code: string }).code).toBe('PASSWORD_CHANGE_REQUIRED');
    }
  });

  it('allows a temporary-password user on routes marked @AllowPendingPasswordChange', () => {
    expect(guard([ALLOW_PENDING_PASSWORD_CHANGE_KEY]).canActivate(ctx(user('STUDENT', true)))).toBe(true);
  });
});
