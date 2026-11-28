'use client';

import type { Role } from '@lms/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/auth';

/** Signed-in layout: top bar with the user's name, role and a sign-out button. */
export function AppShell({ roles, children }: { roles: Role[]; children: ReactNode }) {
  return (
    <RequireAuth roles={roles}>
      <ShellChrome>{children}</ShellChrome>
    </RequireAuth>
  );
}

function ShellChrome({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-indigo-700">
            LMS
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
            </div>
            <Button variant="secondary" onClick={logout} className="px-3 py-2">
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
