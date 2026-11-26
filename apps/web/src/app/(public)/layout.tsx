import type { ReactNode } from 'react';

// Public marketing + course catalogue pages.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
