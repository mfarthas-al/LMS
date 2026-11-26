import type { ReactNode } from 'react';

// STUDENT only. Enforced by middleware.ts (UX) and the API (security).
export default function StudentLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
