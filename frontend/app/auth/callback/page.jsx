'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../_components/auth-shell.module.css';
import { clearAuthToken, fetchCurrentUser, writeAuthToken } from '../../_components/auth-session';
import { resolveDestinationForRole } from '../../_components/auth-flow.mjs';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Finishing sign in...');

  useEffect(() => {
    const error = searchParams.get('error');
    const token = searchParams.get('token');

    if (error === 'cancelled') {
      router.replace('/login');
      return;
    }

    if (!token) {
      setMessage('No token was returned. Please try signing in again.');
      return;
    }

    writeAuthToken(token);
    setMessage('Sign in complete. Resolving your destination.');

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
        router.replace(`/login?error=session_expired`);
      });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className={styles.callbackShell}>
      <section className={styles.callbackCard}>
        <div className={styles.spinner} aria-hidden="true" />
        <h1 className={styles.callbackTitle}>Authenticating</h1>
        <p className={styles.callbackCopy}>{message}</p>
        <div className={styles.callbackActions}>
          <Link className={styles.chip} href="/login">
            Back to login
          </Link>
          <Link className={styles.chip} href="/dashboard">
            Open dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
