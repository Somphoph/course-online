'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
        {/* Subtle background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
          style={{ background: 'rgba(67,56,202,0.06)' }}
          aria-hidden="true"
        />

        {/* Card */}
        <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center rounded-[28px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_20px_40px_rgba(25,28,34,0.08)]">
          {/* Badge */}
          <span className="mb-6 inline-block rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white"
            style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}>
            Admin Console
          </span>

          {/* Spinner */}
          <div
            className="mb-6 h-12 w-12 animate-spin rounded-full border-4"
            style={{
              borderColor: 'rgba(67,56,202,0.12)',
              borderTopColor: '#4338ca',
              animationDuration: '1.5s',
            }}
            aria-hidden="true"
          />

          {/* Text */}
          <div className="mb-6 space-y-2">
            <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">
              Verifying Admin Access
            </h1>
            <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-on-surface-variant">
              {message}
            </p>
          </div>

          {/* Pulse dots */}
          <div className="mb-6 flex items-center justify-center gap-1.5">
            {[0, 200, 400].map((delay) => (
              <div
                key={delay}
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: '#4338ca', animationDelay: `${delay}ms` }}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex w-full items-center justify-center gap-2 border-t border-outline-variant/20 pt-4">
            <span
              className="material-symbols-outlined text-sm text-on-surface-variant"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Secure connection
            </span>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
