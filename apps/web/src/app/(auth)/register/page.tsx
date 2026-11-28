'use client';

import { registerSchema, type SelfRegisterRole } from '@lms/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, Button, Card, Field } from '@/components/ui';
import { authApi } from '@/lib/api';
import { nextStepFor } from '@/lib/auth';
import { apiErrors, validate, type FieldErrors } from '@/lib/forms';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS: { value: SelfRegisterRole; title: string; text: string }[] = [
  { value: 'STUDENT', title: 'Student', text: 'Join courses and learn' },
  { value: 'TEACHER', title: 'Teacher', text: 'Publish your own courses' },
];

export default function Page() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [role, setRole] = useState<SelfRegisterRole>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in when opening the page → skip the form. (While submitting, onSubmit navigates.)
  useEffect(() => {
    if (user && !loading) router.replace(nextStepFor(user));
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const { data, errors } = validate(registerSchema, { name, email, password, role });
    setErrors(errors);
    if (!data) return;
    setLoading(true);
    try {
      const res = await authApi.register(data);
      setUser(res.user);
      router.replace(nextStepFor(res.user));
    } catch (err) {
      const { message, fields } = apiErrors(err);
      setFormError(message);
      setErrors(fields);
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Start learning or teaching in a minute.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Alert>{formError}</Alert>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-slate-700">I am a</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'cursor-pointer rounded-lg border p-3 transition focus-within:ring-2 focus-within:ring-indigo-500/30',
                  role === opt.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-300 bg-white hover:border-slate-400',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-slate-900">{opt.title}</span>
                <span className="block text-xs text-slate-600">{opt.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
