import type { Role } from '../constants/roles';

/** Claims inside the short-lived access token. Keep it small — no personal data. */
export interface JwtPayload {
  sub: string; // user id
  role: Role;
  phoneVerified: boolean;
  sid: string; // session id (one per device)
}
