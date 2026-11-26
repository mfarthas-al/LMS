import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Planned routes:
 *   POST /auth/register          email + password (public)
 *   POST /auth/login             email + password (public)
 *   GET  /auth/google            start Google OAuth (public)
 *   GET  /auth/google/callback   Google OAuth callback (public)
 *   POST /auth/refresh           rotate refresh token (public, needs refresh cookie)
 *   POST /auth/logout            revoke current session
 *   GET  /auth/sessions          list active devices
 *   DELETE /auth/sessions/:id    sign out a device
 *
 * After any sign-up the user must add + verify a phone number (see OtpModule)
 * before they can buy or watch anything (PhoneVerifiedGuard).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
