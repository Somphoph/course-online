'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token, email, ...form }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const firstError =
          payload.errors
            ? Object.values(payload.errors).flat()[0]
            : payload.message;
        setError(firstError ?? 'Password reset failed. The link may have expired.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch {
      setError('Cannot reach the service right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password requirement checks
  const pw = form.password;
  const req8chars = pw.length >= 8;
  const reqNumber = /[0-9]/.test(pw);
  const reqSpecial = /[^a-zA-Z0-9]/.test(pw);

  return (
    <main className="page-shell flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-surface-container p-1 rounded-[2rem]">
          <div className="surface-panel rounded-[1.85rem] p-10 md:p-12">
            <div className="mb-8 flex justify-center" aria-hidden="true">
              <div className="w-12 h-1 bg-primary rounded-full" />
            </div>

            <header className="text-center mb-10">
              <h1 className="section-title mb-4 text-4xl">
                Reset Password
              </h1>
              <p className="section-copy">
                {email
                  ? `Resetting password for ${email}.`
                  : 'Please enter your new password below to regain access to your courses.'}
              </p>
            </header>

            {success ? (
              <p className="status-banner-success text-center">
                Password updated. Redirecting to login…
              </p>
            ) : (
              <>
                {error ? (
                  <p className="status-banner-error mb-6">
                    {error}
                  </p>
                ) : null}
                {!token ? (
                  <p className="status-banner-error mb-6">
                    Invalid reset link. Please request a new one from the{' '}
                    <Link href="/forgot-password" className="underline">
                      forgot password page
                    </Link>
                    .
                  </p>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={handleSubmit}
                    data-page="reset-password"
                  >
                    <div className="field-grid">
                      <label className="field-label ml-1 block text-on-surface" htmlFor="rp-password">
                        New Password
                      </label>
                      <div className="relative group">
                        <input
                          id="rp-password"
                          className="field-input w-full bg-surface-container"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={form.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 font-body text-sm"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      <div className="bg-surface-container rounded-xl p-5 space-y-3 mt-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-body">
                          Security Requirements
                        </h3>
                        <ul className="space-y-2">
                          <li className={`flex items-center gap-3 text-sm font-medium font-body ${req8chars ? 'text-primary' : 'text-on-surface-variant'}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${req8chars ? 'bg-primary' : 'bg-outline-variant'}`} aria-hidden="true" />
                            At least 8 characters long
                          </li>
                          <li className={`flex items-center gap-3 text-sm font-medium font-body ${reqNumber ? 'text-primary' : 'text-on-surface-variant'}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${reqNumber ? 'bg-primary' : 'bg-outline-variant'}`} aria-hidden="true" />
                            Include at least one number
                          </li>
                          <li className={`flex items-center gap-3 text-sm font-medium font-body ${reqSpecial ? 'text-primary' : 'text-on-surface-variant'}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${reqSpecial ? 'bg-primary' : 'bg-outline-variant'}`} aria-hidden="true" />
                            Include one special character
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="field-grid">
                      <label className="field-label ml-1 block text-on-surface" htmlFor="rp-confirm">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <input
                          id="rp-confirm"
                          className="field-input w-full bg-surface-container"
                          type={showConfirm ? 'text' : 'password'}
                          name="password_confirmation"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={form.password_confirmation}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 font-body text-sm"
                          aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                          onClick={() => setShowConfirm((v) => !v)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showConfirm ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      className="btn-primary w-full py-4 text-lg font-bold"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Saving…' : 'Reset Password'}
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="mt-8 text-center">
              <Link
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary no-underline hover:underline decoration-2 underline-offset-4 font-body"
                href="/login"
              >
                <span aria-hidden="true" className="text-sm leading-none">&larr;</span>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
