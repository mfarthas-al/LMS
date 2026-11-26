import type { ReactNode } from 'react';

// ADMIN only. Enforced by middleware.ts (UX) and the API (security).
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
