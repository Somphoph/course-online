'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../_components/auth-shell.module.css';
import { clearAuthToken, fetchCurrentUser, readAuthToken } from '../_components/auth-session';
import { resolveLoginNotice } from '../_components/auth-flow.mjs';

export default function AdminAccessGate({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Checking admin session...');

  useEffect(() => {
    const token = readAuthToken();

    if (!token) {
      router.replace('/admin/login?next=/admin');
      return;
    }

    let active = true;

    fetchCurrentUser(token)
      .then((user) => {
        if (!active) {
          return;
        }

        if (user.role !== 'admin') {
          clearAuthToken();
          router.replace('/admin/login?error=forbidden');
          return;
        }

        setReady(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        clearAuthToken();
        setMessage(resolveLoginNotice('session_expired'));
        router.replace('/admin/login?error=session_expired');
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <main className={styles.callbackShell}>
        <section className={styles.callbackCard}>
          <div className={styles.spinner} aria-hidden="true" />
          <h1 className={styles.callbackTitle}>Admin access</h1>
          <p className={styles.callbackCopy}>{message}</p>
        </section>
      </main>
    );
  }

  return children;
}
