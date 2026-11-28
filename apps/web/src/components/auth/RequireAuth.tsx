'use client';

import type { Role } from '@lms/shared';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Spinner } from '@/components/ui';
import { nextStepFor } from '@/lib/auth';
import { useAuth } from './AuthProvider';

/**
 * Client-side gate for the student / teacher / admin areas. It only shapes the UX —
 * the API enforces the same rules (JwtAuthGuard, AccountStatusGuard, RolesGuard) on every call.
 */
export function RequireAuth({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !!user && roles.includes(user.role) && !user.mustChangePassword;

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (!allowed) {
      router.replace(nextStepFor(user));
    }
  }, [user, allowed, pathname, router]);

  if (!allowed) return <Spinner />;
  return <>{children}</>;
}
