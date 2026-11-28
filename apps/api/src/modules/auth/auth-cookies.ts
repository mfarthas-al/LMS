import type { CookieOptions, Request, Response } from 'express';
import { CLIENT_TYPE_HEADER } from '@lms/shared';
import type { IssuedTokens } from './session.service';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

/** Mobile apps identify themselves and get tokens in the JSON body; browsers get httpOnly cookies. */
export function isMobileClient(req: Request): boolean {
  return req.header(CLIENT_TYPE_HEADER)?.toLowerCase() === 'mobile';
}

export function setAuthCookies(res: Response, tokens: IssuedTokens) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...baseOptions(), maxAge: tokens.accessTtlMs });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...baseOptions(), maxAge: tokens.refreshTtlMs });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseOptions());
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}

export function readRefreshToken(req: Request, bodyToken?: string): string | undefined {
  return bodyToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined);
}

export function clientMeta(req: Request, deviceName?: string) {
  return { ip: req.ip ?? null, userAgent: req.header('user-agent') ?? null, deviceName: deviceName ?? null };
}
