'use client';

import { loginSchema } from '@lms/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, Button, Card, Field } from '@/components/ui';
import { authApi } from '@/lib/api';
import { nextStepFor } from '@/lib/auth';
import { apiErrors, validate, type FieldErrors } from '@/lib/forms';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in when opening the page → skip the form. (While submitting, onSubmit navigates.)
  useEffect(() => {
    if (user && !loading) router.replace(nextStepFor(user, params.get('next')));
  }, [user, loading, params, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const { data, errors } = validate(loginSchema, { email, password });
    setErrors(errors);
    if (!data) return;
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setUser(res.user);
      router.replace(nextStepFor(res.user, params.get('next')));
    } catch (err) {
      const { message, fields } = apiErrors(err);
      setFormError(message);
      setErrors(fields);
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Welcome back. Sign in to continue learning.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Alert>{formError}</Alert>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
          Create an account
        </Link>
      </p>
    </Card>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
