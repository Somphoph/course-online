'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '../_components/auth-shell';
import styles from '../_components/auth-shell.module.css';
import { clearAuthToken, fetchCurrentUser, readAuthToken, writeAuthToken } from '../_components/auth-session';
import { resolveDestinationForRole } from '../_components/auth-flow.mjs';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [status, setStatus] = useState('');
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'Registration failed.');
        return;
      }

      if (payload.token) {
        writeAuthToken(payload.token);
      }

      const currentUser = await fetchCurrentUser(payload.token);

      setStatus('Account created.');

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
          <p className={styles.callbackCopy}>Verifying your current login before showing the form.</p>
        </section>
      </main>
    );
  }

  return (
    <AuthShell
      tone="student"
      eyebrow="Student enrollment"
      brandTitle="Create your account"
      lead="Register once, then switch between email/password and social login without changing the destination."
      bullets={[
        {
          title: 'Student-first onboarding',
          copy: 'The account you create here feeds the learning side of the platform, not the admin workspace.',
        },
        {
          title: 'Flexible sign-in',
          copy: 'The same account can later merge with Google or Facebook if the email matches.',
        },
        {
          title: 'Ready for checkout',
          copy: 'After registration, the next stop is the dashboard and course checkout flow.',
        },
      ]}
      footerLinks={[
        { href: '/login', label: 'Back to login' },
        { href: '/admin/login', label: 'Admin login' },
      ]}
    >
      <header className={styles.panelHeader}>
        <p className={styles.panelKicker}>Register</p>
        <h2 className={styles.panelTitle}>Start learning</h2>
        <p className={styles.panelLead}>Create a student account with your email and password.</p>
      </header>

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
          <span className={styles.label}>Full name</span>
          <input className={styles.input} name="name" type="text" autoComplete="name" required value={form.name} onChange={handleChange} />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input className={styles.input} name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Phone number</span>
          <input className={styles.input} name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input className={styles.input} name="password" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={handleChange} />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Confirm password</span>
          <input className={styles.input} name="password_confirmation" type="password" autoComplete="new-password" minLength={8} required value={form.password_confirmation} onChange={handleChange} />
        </label>

        <div className={styles.formActions}>
          <button className={styles.primaryButton} disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <Link className={styles.inlineLink} href="/login">
            Already have an account?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
