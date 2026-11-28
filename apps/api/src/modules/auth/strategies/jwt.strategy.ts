import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '@lms/shared';
import type { RequestUser } from '../../../common/types/request-user';
import { ACCESS_COOKIE } from '../auth-cookies';
import { SessionService } from '../session.service';

/**
 * Reads the access token from the httpOnly cookie (web) or the Authorization header (mobile),
 * then checks the session is still live and loads role/verification state fresh from the DB,
 * so logouts, deactivations and role changes take effect immediately.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly sessions: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => (req?.cookies?.[ACCESS_COOKIE] as string | undefined) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const session = await this.sessions.findLive(payload.sid, payload.sub);
    if (!session) {
      throw new UnauthorizedException({ code: 'SESSION_INVALID', message: 'Please sign in again' });
    }
    const { user } = session;
    return {
      id: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      sessionId: session.id,
    };
  }
}
