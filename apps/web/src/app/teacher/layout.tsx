import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

// TEACHER only. AppShell redirects in the browser; the API enforces the same rules on every call.
export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <AppShell roles={['TEACHER']}>{children}</AppShell>;
}
