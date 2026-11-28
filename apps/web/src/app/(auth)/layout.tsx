import Link from 'next/link';
import type { ReactNode } from 'react';

// Sign-in / sign-up / password pages.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 to-slate-50">
      <header className="px-4 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
          LMS
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
