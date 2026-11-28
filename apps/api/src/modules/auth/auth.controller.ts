import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  type AuthResponse,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterInput,
} from '@lms/shared';
import { AllowPendingPasswordChange } from '../../common/decorators/account-status.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../../common/types/request-user';
import { UsersService } from '../users/users.service';
import {
  clearAuthCookies,
  clientMeta,
  isMobileClient,
  readRefreshToken,
  setAuthCookies,
} from './auth-cookies';
import { AuthService } from './auth.service';
import type { IssuedTokens } from './session.service';

/** Stricter limits than the global 100/min on routes that create accounts or guess passwords. */
const STRICT = { default: { limit: 10, ttl: 60_000 } };
/** Per IP. Kept loose (shared school / mobile-carrier IPs); AuthService also locks an account after 5 failures. */
const LOGIN = { default: { limit: 30, ttl: 60_000 } };

/**
 * Routes (all under /api/v1/auth):
 *   POST   /register          email + password, role STUDENT or TEACHER (public)
 *   POST   /login             email + password (public)
 *   POST   /refresh           rotate refresh token (public; cookie or body)
 *   POST   /logout            revoke this device's session (public; cookie or body)
 *   GET    /me                current user
 *   POST   /change-password   also replaces an admin-issued temporary password
 *   GET    /sessions          list active devices
 *   DELETE /sessions/:id      sign out a device
 *
 * Forgotten passwords: an admin issues a new temporary password (POST /admin/users/:id/reset-password).
 * Google sign-in (GET /google, /google/callback) is added once GOOGLE_CLIENT_ID / SECRET are configured.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Throttle(STRICT)
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { user, tokens } = await this.auth.register(body, clientMeta(req));
    return this.respond(req, res, user, tokens);
  }

  @Public()
  @Throttle(LOGIN)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { user, tokens } = await this.auth.login(body, clientMeta(req, body.deviceName));
    return this.respond(req, res, user, tokens);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      const { user, tokens } = await this.auth.refresh(
        readRefreshToken(req, body.refreshToken),
        clientMeta(req),
      );
      return this.respond(req, res, user, tokens);
    } catch (err) {
      // Keep cookies on a race (the other request already set fresh ones); otherwise clear them.
      const code = (err as { response?: { code?: string } }).response?.code;
      if (code !== 'REFRESH_RACE' && !isMobileClient(req)) clearAuthCookies(res);
      throw err;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(readRefreshToken(req, body.refreshToken), clientMeta(req));
    clearAuthCookies(res);
  }

  @AllowPendingPasswordChange()
  @Get('me')
  async me(@CurrentUser() current: RequestUser) {
    return this.users.toAuthUser(await this.auth.me(current.id));
  }

  @AllowPendingPasswordChange()
  @Throttle(STRICT)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() current: RequestUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
    @Req() req: Request,
  ) {
    const user = await this.auth.changePassword(
      current.id,
      current.sessionId,
      body,
      clientMeta(req),
    );
    return this.users.toAuthUser(user);
  }

  @Get('sessions')
  sessions(@CurrentUser() current: RequestUser) {
    return this.auth.listSessions(current.id, current.sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUser() current: RequestUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await this.auth.revokeSession(current.id, id, clientMeta(req));
  }

  private respond(req: Request, res: Response, user: User, tokens: IssuedTokens): AuthResponse {
    const authUser = this.users.toAuthUser(user);
    if (isMobileClient(req)) {
      return { user: authUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    setAuthCookies(res, tokens);
    return { user: authUser };
  }
}
