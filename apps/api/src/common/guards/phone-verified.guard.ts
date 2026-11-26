import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Blocks access until the user has verified their phone number via SMS OTP.
 * Applies to every account, whether it signed up with email/password or Google.
 */
@Injectable()
export class PhoneVerifiedGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.phoneVerified) throw new ForbiddenException('PHONE_NOT_VERIFIED');
    return true;
  }
}
