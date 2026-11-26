import type { ReactNode } from 'react';

// TEACHER only. Enforced by middleware.ts (UX) and the API (security).
export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
