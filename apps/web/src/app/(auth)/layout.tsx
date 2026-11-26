import type { ReactNode } from 'react';

// Sign-in / sign-up / phone verification.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
