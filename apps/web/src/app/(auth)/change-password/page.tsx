'use client';

import { changePasswordSchema } from '@lms/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, Button, Card, Field, Spinner } from '@/components/ui';
import { authApi } from '@/lib/api';
import { nextStepFor } from '@/lib/auth';
import { apiErrors, validate, type FieldErrors } from '@/lib/forms';

/** Shown first for accounts an admin created with a temporary password; also usable any time. */
export default function Page() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) router.replace('/login?next=/change-password');
  }, [user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const { data, errors } = validate(changePasswordSchema, { currentPassword, newPassword });
    if (data && newPassword !== confirm) errors.confirm = 'Passwords do not match';
    setErrors(errors);
    if (!data || errors.confirm) return;
    setLoading(true);
    try {
      const updated = await authApi.changePassword(data);
      setUser(updated);
      router.replace(nextStepFor(updated));
    } catch (err) {
      const { message, fields } = apiErrors(err);
      setFormError(message);
      setErrors(fields);
      setLoading(false);
    }
  }

  if (!user) return <Spinner />;
  const temporary = user.mustChangePassword;

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">
        {temporary ? 'Choose your own password' : 'Change password'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {temporary
          ? 'Your account was created with a temporary password. Replace it with one only you know.'
          : 'You will stay signed in here and be signed out on your other devices.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Alert>{formError}</Alert>
        <Field
          label={temporary ? 'Temporary password' : 'Current password'}
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.currentPassword}
          required
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          hint="At least 8 characters, with a letter and a number."
          required
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Save password
        </Button>
      </form>

      <div className="mt-6 flex justify-between text-sm">
        {!temporary && (
          <button onClick={() => router.back()} className="font-medium text-slate-600 hover:text-slate-900">
            Cancel
          </button>
        )}
        <button onClick={logout} className="ml-auto font-medium text-indigo-600 hover:text-indigo-700">
          Sign out
        </button>
      </div>
    </Card>
  );
}
