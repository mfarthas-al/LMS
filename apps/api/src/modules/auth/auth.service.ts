import { Injectable } from '@nestjs/common';

/**
 * Responsibilities:
 * - Hash passwords with argon2id; never store or log plain passwords.
 * - Issue a short-lived access token (15m) + a rotating refresh token (30d).
 *   Refresh tokens are stored hashed in the Session table; reuse of an old token revokes the whole family.
 * - Enforce MAX_ACTIVE_DEVICES_PER_STUDENT to limit account sharing.
 * - Web: tokens in httpOnly, Secure, SameSite cookies. Mobile: tokens in expo-secure-store.
 */
@Injectable()
export class AuthService {}
