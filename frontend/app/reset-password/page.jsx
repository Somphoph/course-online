'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '../_components/auth-shell';
import styles from '../_components/auth-shell.module.css';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [form, setForm] = useState({ password: '', password_confirmation: '' });
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

  return (
    <AuthShell
      tone="student"
      eyebrow="Student access"
      brandTitle="Course Online"
      lead="Choose a new password for your account."
      bullets={[
        {
          title: 'Minimum 8 characters',
          copy: 'Use a strong password you do not reuse on other sites.',
        },
        {
          title: 'Link expires in 60 minutes',
          copy: 'Request a new link from the forgot-password page if this one has expired.',
        },
      ]}
      footerLinks={[{ href: '/login', label: 'Back to login' }]}
    >
      <header className={styles.panelHeader}>
        <p className={styles.panelKicker}>reset-password</p>
        <h2 className={styles.panelTitle}>Set new password</h2>
        <p className={styles.panelLead}>
          {email ? `Resetting password for ${email}` : 'Enter your new password below.'}
        </p>
      </header>

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
              <a href="/forgot-password" style={{ color: 'inherit' }}>
                forgot password page
              </a>
              .
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.label}>New password</span>
                <input
                  className={styles.input}
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Confirm new password</span>
                <input
                  className={styles.input}
                  type="password"
                  name="password_confirmation"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password_confirmation}
                  onChange={handleChange}
                />
              </label>
              <div className={styles.formActions}>
                <button className={styles.primaryButton} disabled={loading} type="submit">
                  {loading ? 'Saving...' : 'Set new password'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
