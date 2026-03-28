'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

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
    <main className={styles.shell}>
      <div className={styles.card}>
        {/* reset-password identifier preserved for smoke test */}
        <h1 className={styles.heading}>Reset Password</h1>
        <p className={styles.subheading}>
          {email
            ? `Resetting password for ${email}.`
            : 'Please enter your new password below to regain access to your courses.'}
        </p>

        {success ? (
          <p className={styles.success}>
            Password updated. Redirecting to login…
          </p>
        ) : (
          <>
            {error ? <p className={styles.alert}>{error}</p> : null}
            {!token ? (
              <p className={styles.alert}>
                Invalid reset link. Please request a new one from the{' '}
                <Link href="/forgot-password" style={{ color: 'inherit' }}>
                  forgot password page
                </Link>
                .
              </p>
            ) : (
              <form
                className={styles.form}
                onSubmit={handleSubmit}
                data-page="reset-password"
              >
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="rp-password">
                    New Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="rp-password"
                      className={styles.input}
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
                      className={styles.eyeButton}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                  {/* Password requirements checklist */}
                  <ul className={styles.requirements}>
                    <li className={`${styles.reqItem} ${req8chars ? styles.met : ''}`}>
                      <span className={styles.reqDot} />
                      At least 8 characters long
                    </li>
                    <li className={`${styles.reqItem} ${reqNumber ? styles.met : ''}`}>
                      <span className={styles.reqDot} />
                      Include at least one number
                    </li>
                    <li className={`${styles.reqItem} ${reqSpecial ? styles.met : ''}`}>
                      <span className={styles.reqDot} />
                      Include one special character
                    </li>
                  </ul>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="rp-confirm">
                    Confirm New Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="rp-confirm"
                      className={styles.input}
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
                      className={styles.eyeButton}
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>

                <button className={styles.submitButton} disabled={loading} type="submit">
                  {loading ? 'Saving…' : 'Reset Password'}
                </button>
              </form>
            )}
          </>
        )}

        <Link className={styles.backLink} href="/login">
          <span className={styles.backArrow} aria-hidden="true">arrow_back</span>
          Back to Login
        </Link>
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
