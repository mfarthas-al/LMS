'use client';

import type { SessionInfo } from '@lms/shared';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, Button } from '@/components/ui';
import { authApi } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/auth';
import { apiErrors } from '@/lib/forms';

function describeDevice(s: SessionInfo) {
  if (s.deviceName) return s.deviceName;
  const ua = s.userAgent ?? '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} on ${os}` : browser;
}

/** Profile summary + signed-in devices, with sign-out per device. */
export function AccountPanel() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    authApi
      .sessions()
      .then(setSessions)
      .catch((err) => setError(apiErrors(err).message));
  }, []);
  useEffect(load, [load]);

  async function revoke(id: string) {
    setBusy(id);
    try {
      await authApi.revokeSession(id);
      load();
    } catch (err) {
      setError(apiErrors(err).message);
    } finally {
      setBusy(null);
    }
  }

  if (!user) return null;
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold">Your account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Role" value={ROLE_LABEL[user.role]} />
        </dl>
        <Link
          href="/change-password"
          className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Change password →
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold">Signed-in devices</h2>
        {user.role === 'STUDENT' && (
          <p className="mt-1 text-xs text-slate-500">
            Student accounts can be signed in on a limited number of devices. Signing in on a new one
            signs out the least recently used.
          </p>
        )}
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
        <ul className="mt-2 divide-y divide-slate-100">
          {sessions === null && <li className="py-3 text-sm text-slate-500">Loading…</li>}
          {sessions?.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {describeDevice(s)}
                  {s.current && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">Last active {new Date(s.lastUsedAt).toLocaleString()}</p>
              </div>
              {!s.current && (
                <Button variant="ghost" className="px-2 py-1 text-xs" loading={busy === s.id} onClick={() => revoke(s.id)}>
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
