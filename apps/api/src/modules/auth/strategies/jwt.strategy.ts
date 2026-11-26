import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '@lms/shared';

/** Reads the access token from the httpOnly cookie (web) or the Authorization header (mobile). */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    // TODO: check the session is still active (not revoked) once sessions are implemented.
    return {
      id: payload.sub,
      role: payload.role,
      phoneVerified: payload.phoneVerified,
      sessionId: payload.sid,
    };
  }
}
