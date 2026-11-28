import type { Role } from '@lms/shared';

/** What JwtStrategy puts on `req.user`. Loaded fresh from the database on every request. */
export interface RequestUser {
  id: string;
  role: Role;
  mustChangePassword: boolean;
  sessionId: string;
}
