import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

// STUDENT only. AppShell redirects in the browser; the API enforces the same rules on every call.
export default function StudentLayout({ children }: { children: ReactNode }) {
  return <AppShell roles={['STUDENT']}>{children}</AppShell>;
}
