import Link from 'next/link';
import { Card } from '@/components/ui';

/** No self-service reset yet: an admin issues a new temporary password from the Users page. */
export default function Page() {
  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-3 text-sm text-slate-600">
        Contact your administrator and ask them to reset it. They&apos;ll give you a temporary password,
        and you&apos;ll choose a new one the next time you sign in.
      </p>
      <Link
        href="/login"
        className="mt-6 block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Back to sign in
      </Link>
    </Card>
  );
}
