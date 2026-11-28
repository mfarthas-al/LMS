import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

// ADMIN and SUPER_ADMIN. AppShell redirects in the browser; the API enforces the same rules on every call.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell roles={['ADMIN', 'SUPER_ADMIN']}>{children}</AppShell>;
}
