'use client';

import { useState } from 'react';
import { AuthShell } from '../_components/auth-shell';
import styles from '../_components/auth-shell.module.css';

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
    <AuthShell
      tone="student"
      eyebrow="Student access"
      brandTitle="Course Online"
      lead="Enter your email and we will send a link to reset your password."
      bullets={[
        {
          title: 'Check your inbox',
          copy: 'The reset link expires after 60 minutes.',
        },
        {
          title: 'Social accounts',
          copy: 'Accounts created via Google or Facebook do not have a password to reset.',
        },
      ]}
      footerLinks={[
        { href: '/login', label: 'Back to login' },
        { href: '/register', label: 'Create account' },
      ]}
    >
      <header className={styles.panelHeader}>
        <p className={styles.panelKicker}>forgot-password</p>
        <h2 className={styles.panelTitle}>Reset your password</h2>
        <p className={styles.panelLead}>We will email you a reset link.</p>
      </header>

      {sent ? (
        <p className={styles.success}>
          Reset link sent. Check your email inbox (and spam folder).
        </p>
      ) : (
        <>
          {error ? <p className={styles.alert}>{error}</p> : null}
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Email</span>
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
            <div className={styles.formActions}>
              <button className={styles.primaryButton} disabled={loading} type="submit">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
