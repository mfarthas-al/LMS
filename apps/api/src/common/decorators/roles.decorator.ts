import { SetMetadata } from '@nestjs/common';
import type { Role } from '@lms/shared';

export const ROLES_KEY = 'roles';

/** Restricts a route to the listed roles, e.g. @Roles('ADMIN'). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
