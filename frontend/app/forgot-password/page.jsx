'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'Unable to send reset link.');
        return;
      }

      setSent(true);
    } catch {
      setError('Cannot reach the service right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        {/* Icon badge — lock_reset Material Symbol */}
        <div className={styles.iconBadge} aria-hidden="true">
          lock_reset
        </div>

        {/* forgot-password kicker preserved for smoke test */}
        <h1 className={styles.heading}>Forgot Password</h1>
        <p className={styles.subheading}>
          No worries, it happens. Enter your email and we&rsquo;ll send you a link to reset it.
        </p>

        {sent ? (
          <p className={styles.success}>
            Reset link sent. Check your email inbox (and spam folder).
          </p>
        ) : (
          <>
            {error ? <p className={styles.alert}>{error}</p> : null}
            <form className={styles.form} onSubmit={handleSubmit} data-page="forgot-password">
              <label className={styles.field}>
                <span className={styles.label}>Email Address</span>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button className={styles.submitButton} disabled={loading} type="submit">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
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

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
