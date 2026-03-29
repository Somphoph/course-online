'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    <main className="auth-loading-shell px-6 py-12">
      <section className="auth-loading-card grid max-w-xl gap-5 sm:p-10">
        <div
          className="spinner-ring"
          style={{ borderColor: 'rgba(0,106,220,0.18)', borderTopColor: '#006adc' }}
          aria-hidden="true"
        />
        <div className="grid gap-2">
          <h1 className="section-title text-[clamp(2rem,4vw,2.75rem)]">
            Authenticating
          </h1>
          <p className="section-copy text-sm sm:text-base">{message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link className="chip-link" href="/login">
            Back to login
          </Link>
          <Link className="chip-link" href="/dashboard">
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
