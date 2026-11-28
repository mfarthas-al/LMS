export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'] as const;
export type Role = (typeof ROLES)[number];

/** Roles anyone can sign up for on the public register page. */
export const SELF_REGISTER_ROLES = ['STUDENT', 'TEACHER'] as const satisfies readonly Role[];
export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

/** Roles that run the platform. */
export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const satisfies readonly Role[];

/** Which roles each role is allowed to create from the admin area. */
export const CREATABLE_ROLES: Record<Role, readonly Role[]> = {
  SUPER_ADMIN: ['ADMIN', 'TEACHER', 'STUDENT'],
  ADMIN: ['TEACHER', 'STUDENT'],
  TEACHER: [],
  STUDENT: [],
};

export function isAdminRole(role: Role): boolean {
  return (ADMIN_ROLES as readonly Role[]).includes(role);
}
