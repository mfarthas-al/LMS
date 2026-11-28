'use client';

import {
  adminCreateUserSchema,
  CREATABLE_ROLES,
  type AdminCreateUserResponse,
  type AdminUserRow,
  type Paginated,
  type Role,
} from '@lms/shared';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, Button, Field, Select } from '@/components/ui';
import { authApi } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/auth';
import { apiErrors, validate, type FieldErrors } from '@/lib/forms';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

/**
 * Create and manage accounts. Super admins manage admins, teachers and students;
 * admins manage teachers and students (enforced by the API too).
 */
export function UsersManager() {
  const { user } = useAuth();
  const manageable = user ? CREATABLE_ROLES[user.role] : [];

  const [filterRole, setFilterRole] = useState<Role | ''>('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminUserRow> | null>(null);
  const [listError, setListError] = useState('');
  const [issued, setIssued] = useState<
    (AdminCreateUserResponse & { reason: 'created' | 'reset' }) | null
  >(null);

  const load = useCallback(() => {
    setListError('');
    authApi.admin
      .listUsers({
        role: filterRole || undefined,
        search: query || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then(setData)
      .catch((err) => setListError(apiErrors(err).message));
  }, [filterRole, query, page]);
  useEffect(load, [load]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-8">
      <CreateUserForm
        roles={manageable}
        onCreated={(res) => {
          setIssued({ ...res, reason: 'created' });
          setPage(1);
          load();
        }}
      />

      {issued && <TemporaryPassword issued={issued} onClose={() => setIssued(null)} />}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end">
          <h2 className="flex-1 text-base font-semibold">Accounts</h2>
          <Select
            label="Role"
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value as Role | '');
              setPage(1);
            }}
            className="sm:w-44"
          >
            <option value="">All</option>
            {manageable.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Field
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
        </div>

        <div className="p-4">
          <Alert>{listError}</Alert>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Created by</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items.map((row) => (
                <UserRow
                  key={row.id}
                  row={row}
                  isSelf={row.id === user?.id}
                  onChanged={load}
                  onReset={(res) => setIssued({ ...res, reason: 'reset' })}
                />
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No accounts found.
                  </td>
                </tr>
              )}
              {!data && !listError && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
            <span className="text-slate-500">
              Page {page} of {pages} · {data.total} accounts
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function CreateUserForm({
  roles,
  onCreated,
}: {
  roles: readonly Role[];
  onCreated: (res: AdminCreateUserResponse) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(roles[0] ?? 'STUDENT');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const { data, errors } = validate(adminCreateUserSchema, { name, email, role });
    setErrors(errors);
    if (!data) return;
    setLoading(true);
    try {
      const res = await authApi.admin.createUser(data);
      setName('');
      setEmail('');
      onCreated(res);
    } catch (err) {
      const { message, fields } = apiErrors(err);
      setFormError(message);
      setErrors(fields);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold">Create an account</h2>
      <p className="mt-1 text-sm text-slate-600">
        A temporary password is generated. The person must change it at first sign-in.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_12rem_auto] sm:items-start"
        noValidate
      >
        <Field
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
        <Button type="submit" loading={loading} className="sm:mt-[1.6rem]">
          Create
        </Button>
      </form>
      <div className="mt-3">
        <Alert>{formError}</Alert>
      </div>
    </section>
  );
}

function TemporaryPassword({
  issued,
  onClose,
}: {
  issued: AdminCreateUserResponse & { reason: 'created' | 'reset' };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
      <h3 className="font-semibold text-emerald-900">
        {issued.reason === 'created' ? 'Account created' : 'Password reset'} for {issued.user.name}{' '}
        ({ROLE_LABEL[issued.user.role]})
      </h3>
      <p className="mt-1 text-sm text-emerald-800">
        Give them these sign-in details privately. The temporary password is shown only once.
      </p>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
        <span className="text-emerald-800">Email</span>
        <span className="font-medium text-emerald-950">{issued.user.email}</span>
        <span className="text-emerald-800">Temporary password</span>
        <span className="flex flex-wrap items-center gap-3">
          <code className="rounded bg-white px-2 py-1 font-mono text-base text-emerald-950">
            {issued.temporaryPassword}
          </code>
          <button
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            onClick={async () => {
              await navigator.clipboard.writeText(issued.temporaryPassword).catch(() => undefined);
              setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>
      <Button variant="secondary" className="mt-5" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

function UserRow({
  row,
  isSelf,
  onChanged,
  onReset,
}: {
  row: AdminUserRow;
  isSelf: boolean;
  onChanged: () => void;
  onReset: (res: AdminCreateUserResponse) => void;
}) {
  const [busy, setBusy] = useState<'status' | 'reset' | null>(null);
  const [error, setError] = useState('');

  async function toggle() {
    if (row.isActive && !confirm(`Disable ${row.name}? They will be signed out on every device.`))
      return;
    setBusy('status');
    setError('');
    try {
      await authApi.admin.setUserStatus(row.id, !row.isActive);
      onChanged();
    } catch (err) {
      setError(apiErrors(err).message);
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    if (
      !confirm(
        `Reset ${row.name}'s password? They will be signed out and must use the new temporary password.`,
      )
    )
      return;
    setBusy('reset');
    setError('');
    try {
      onReset(await authApi.admin.resetUserPassword(row.id));
      onChanged();
    } catch (err) {
      setError(apiErrors(err).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <tr className={cn(!row.isActive && 'bg-slate-50 text-slate-500')}>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{row.name}</p>
        <p className="text-xs text-slate-500">{row.email}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-4 py-3">{ROLE_LABEL[row.role]}</td>
      <td className="px-4 py-3">
        <StatusBadge row={row} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{row.createdBy?.name ?? 'Self sign-up'}</td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              loading={busy === 'reset'}
              onClick={reset}
            >
              Reset password
            </Button>
            <Button
              variant="ghost"
              className={cn('px-2 py-1 text-xs', row.isActive && 'text-red-600 hover:bg-red-50')}
              loading={busy === 'status'}
              onClick={toggle}
            >
              {row.isActive ? 'Disable' : 'Enable'}
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ row }: { row: AdminUserRow }) {
  const [label, style] = !row.isActive
    ? ['Disabled', 'bg-slate-200 text-slate-700']
    : row.mustChangePassword
      ? ['Awaiting first sign-in', 'bg-amber-100 text-amber-800']
      : ['Active', 'bg-emerald-100 text-emerald-800'];
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', style)}>{label}</span>;
}
