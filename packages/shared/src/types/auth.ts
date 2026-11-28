import type { Role } from '../constants/roles';

/** Claims inside the short-lived access token. Keep it small — no personal data. */
export interface JwtPayload {
  sub: string; // user id
  role: Role;
  sid: string; // session id (one per device)
}

/** The signed-in user as returned by the API (never contains secrets). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

/** Login / register / refresh response. Tokens are only included for mobile clients. */
export interface AuthResponse {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export interface SessionInfo {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ip: string | null;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Returned once when an admin creates an account. The temporary password is never shown again. */
export interface AdminCreateUserResponse {
  user: AdminUserRow;
  temporaryPassword: string;
}

/** Header mobile apps send so the API returns tokens in the body instead of cookies. */
export const CLIENT_TYPE_HEADER = 'x-client-type';
