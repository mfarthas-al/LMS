'use client';

import { useAuth } from '@/components/auth/AuthProvider';

export function WelcomeHeader({ subtitle }: { subtitle: string }) {
  const { user } = useAuth();
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user?.name.split(' ')[0]}</h1>
      <p className="mt-1 text-slate-600">{subtitle}</p>
    </div>
  );
}
