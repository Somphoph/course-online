'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '../../_components/auth-shell';
import styles from '../../_components/auth-shell.module.css';
import { clearAuthToken, fetchCurrentUser, readAuthToken, writeAuthToken } from '../../_components/auth-session';
import { isAdminRole, resolveDestinationForRole, resolveLoginNotice } from '../../_components/auth-flow.mjs';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = readAuthToken();

    if (!token) {
      setCheckingSession(false);
      return;
    }

    let active = true;

    fetchCurrentUser(token)
      .then((user) => {
        if (!active) {
          return;
        }

        if (user.role === 'admin') {
          router.replace(resolveDestinationForRole(user.role));
        } else {
          clearAuthToken();
          setCheckingSession(false);
          setError(resolveLoginNotice('forbidden'));
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        clearAuthToken();
        setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'Admin sign in failed.');
        return;
      }

      if (payload.token) {
        writeAuthToken(payload.token);
      }

      const currentUser = await fetchCurrentUser(payload.token);

      if (!isAdminRole(currentUser.role)) {
        clearAuthToken();
        setError(resolveLoginNotice('forbidden'));
        return;
      }

      router.replace(resolveDestinationForRole(currentUser.role));
      router.refresh();
    } catch {
      clearAuthToken();
      setError('Cannot reach the auth service right now.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className={styles.callbackShell}>
        <section className={styles.callbackCard}>
          <div className={styles.spinner} aria-hidden="true" />
          <h1 className={styles.callbackTitle}>Checking session</h1>
          <p className={styles.callbackCopy}>Verifying whether this device already has admin access.</p>
        </section>
      </main>
    );
  }

  return (
    <AuthShell
      tone="admin"
      eyebrow="Admin access"
      brandTitle="Admin console"
      lead="Sign in to manage enrollments, courses, lessons, bundles, and students from the operations side."
      bullets={[
        {
          title: 'Operational scope',
          copy: 'This route is separate from student login so staff do not land in the learner flow by accident.',
        },
        {
          title: 'Password-only',
          copy: 'Admin access stays clear and direct, with no social providers attached.',
        },
        {
          title: 'Focused workspace',
          copy: 'The design is stripped down for fast entry into the control panel.',
        },
      ]}
      footerLinks={[
        { href: '/login', label: 'Student login' },
        { href: '/admin', label: 'Open admin dashboard' },
      ]}
    >
      <header className={styles.panelHeader}>
        <p className={styles.panelKicker}>Administration</p>
        <h2 className={styles.panelTitle}>Sign in to continue</h2>
        <p className={styles.panelLead}>Use your staff account to enter the admin dashboard.</p>
      </header>

      {error ? <p className={styles.alert}>{error}</p> : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            className={styles.input}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </label>

        <div className={styles.formActions}>
          <button className={styles.primaryButton} disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in to admin'}
          </button>
          <Link className={styles.inlineLink} href="/login">
            Student login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
