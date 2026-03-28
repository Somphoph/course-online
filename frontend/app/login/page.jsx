'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthShell } from '../_components/auth-shell';
import styles from '../_components/auth-shell.module.css';
import { clearAuthToken, fetchCurrentUser, readAuthToken, writeAuthToken } from '../_components/auth-session';
import { resolveDestinationForRole, resolveLoginNotice } from '../_components/auth-flow.mjs';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const notice = resolveLoginNotice(searchParams.get('error'));

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

        router.replace(resolveDestinationForRole(user.role));
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

  const socialLogin = (provider) => {
    window.location.assign(`/api/auth/${provider}/redirect`);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'Login failed.');
        return;
      }

      if (payload.token) {
        writeAuthToken(payload.token);
      }

      const currentUser = await fetchCurrentUser(payload.token);

      if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }

      setStatus('Signed in successfully.');
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
          <p className={styles.callbackCopy}>Verifying your current login before showing the form.</p>
        </section>
      </main>
    );
  }

  return (
    <AuthShell
      tone="student"
      eyebrow="Student access"
      brandTitle="Course Online"
      lead="Sign in to browse lessons, complete checkout, and continue from where you left off."
      bullets={[
        {
          title: 'One account, two options',
          copy: 'Use email and password, or continue with Google and Facebook when social login is enabled.',
        },
        {
          title: 'Course-focused flow',
          copy: 'Everything here points students back to the learning experience, not the admin console.',
        },
        {
          title: 'Fast handoff',
          copy: 'Successful auth stores the token locally and sends the user to the dashboard.',
        },
      ]}
      footerLinks={[
        { href: '/register', label: 'Create student account' },
        { href: '/admin/login', label: 'Admin login' },
      ]}
    >
      <header className={styles.panelHeader}>
        <p className={styles.panelKicker}>Login</p>
        <h2 className={styles.panelTitle}>Welcome back</h2>
        <p className={styles.panelLead}>Use your student account to continue learning.</p>
      </header>

      {notice ? <p className={styles.alert}>{notice}</p> : null}

      {status ? <p className={styles.success}>{status}</p> : null}
      {error ? <p className={styles.alert}>{error}</p> : null}

      <div className={styles.socialGrid}>
        <button className={styles.socialButton} disabled={loading} type="button" onClick={() => socialLogin('google')}>
          <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
          Continue with Google
        </button>
        <button className={styles.socialButton} disabled={loading} type="button" onClick={() => socialLogin('facebook')}>
          <span className={`${styles.socialIcon} ${styles.facebook}`}>f</span>
          Continue with Facebook
        </button>
      </div>

      <div className={styles.divider}>or use email</div>

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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link className={styles.inlineLink} href="/register">
              New here? Register
            </Link>
            <Link className={styles.inlineLink} href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  );
}
