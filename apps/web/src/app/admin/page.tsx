import Link from 'next/link';
import { AccountPanel } from '@/components/auth/AccountPanel';
import { WelcomeHeader } from '@/components/WelcomeHeader';

export default function Page() {
  return (
    <>
      <WelcomeHeader subtitle="Manage accounts and the platform." />
      <Link
        href="/admin/users"
        className="mb-6 block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm"
      >
        <h2 className="text-base font-semibold">Users →</h2>
        <p className="mt-1 text-sm text-slate-600">Create accounts, reset passwords and disable access.</p>
      </Link>
      <AccountPanel />
    </>
  );
}
