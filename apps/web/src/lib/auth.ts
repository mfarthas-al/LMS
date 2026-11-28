import type { AuthUser, Role } from '@lms/shared';

/** Each role's home area. */
export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student',
  TEACHER: '/teacher',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super admin',
};

/** Where a signed-in user should go next: replace a temporary password first, then their area. */
export function nextStepFor(user: AuthUser, wanted?: string | null): string {
  if (user.mustChangePassword) return '/change-password';
  const home = ROLE_HOME[user.role];
  // Only follow ?next= for same-site paths inside the user's own area.
  if (wanted && wanted.startsWith(home) && !wanted.startsWith('//')) return wanted;
  return home;
}
