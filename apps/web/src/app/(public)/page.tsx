'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { nextStepFor } from '@/lib/auth';

export default function Page() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-xl font-bold tracking-tight text-indigo-700">LMS</span>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link
              href={nextStepFor(user)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:pt-28">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Learn from Sri Lanka&apos;s best teachers.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Video lessons and study materials, on the web and on your Android phone.
        </p>
        {!user && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Get started
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              I&apos;m a teacher
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
