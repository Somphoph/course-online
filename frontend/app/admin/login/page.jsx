'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuthToken, fetchCurrentUser, readAuthToken, writeAuthToken } from '../../_components/auth-session';
import { isAdminRole, resolveDestinationForRole, resolveLoginNotice } from '../../_components/auth-flow.mjs';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDV01dIOl1KyxrpGxtsIOSzi6Ebim76lojiOQOExLyj76g4UoFgPzd9AI24_Rm0r1AZHT3mrxMpaGcDkNEeQW464bXSTfaKwU0e0H1r0KNWkL6Vrh1nuhDJL0Cf5xQkHBQJwRvyJyxANZu4Huo_V7Qpht00CTlBMW05pV9VetKCAqr72zTlfz08YcWQ7RpO_yFmhy2BkmjTeyZTIgY6rJUV1X29JJET35htd0rvZLWRJt2GcGcHi8lrhfWRTbdZxqDblHmKtL4I0_g';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = readAuthToken();

    if (!token) {
      setCheckingSession(false);
      return;
    }

    let active = true;

    fetchCurrentUser(token)
      .then((user) => {
        if (!active) return;
        if (user.role === 'admin') {
          router.replace(resolveDestinationForRole(user.role));
        } else {
          clearAuthToken();
          setCheckingSession(false);
          setError(resolveLoginNotice('forbidden'));
        }
      })
      .catch(() => {
        if (!active) return;
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
      <main className="grid min-h-screen place-items-center bg-background p-8">
        <section className="w-full max-w-[480px] rounded-[28px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_40px_rgba(25,28,34,0.08)]">
          <div
            className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4"
            style={{ borderColor: 'rgba(67,56,202,0.18)', borderTopColor: '#4338ca' }}
            aria-hidden="true"
          />
          <h1 className="m-0 font-headline text-[1.8rem] font-bold text-on-surface">Checking session</h1>
          <p className="mt-2 text-on-surface/72">Verifying whether this device already has admin access.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] shadow-2xl shadow-on-surface/5 md:flex-row"
          style={{ background: '#f2f3fd' }}>

          {/* Left: dark image panel */}
          <div className="relative hidden overflow-hidden bg-inverse-surface md:flex md:w-5/12 lg:w-1/2">
            <div className="absolute inset-0 opacity-60">
              <img alt="Admin workspace" className="h-full w-full object-cover" src={HERO_IMAGE} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-transparent" />
            {/* Indigo overlay tint */}
            <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, #312e81, #4338ca)' }} />
            <div className="relative z-10 flex h-full flex-col justify-between p-12">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(99,102,241,0.25)', color: '#c7d2fe' }}>
                  Admin Access
                </div>
                <h1 className="font-headline text-3xl font-extrabold leading-none tracking-tighter text-white">
                  The Academic Editorial
                </h1>
                <p className="mt-4 max-w-xs font-medium text-surface-container-highest/80">
                  Operations console for managing courses, enrollments, and students.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-md"
                    style={{ background: 'rgba(99,102,241,0.2)' }}>
                    <span className="material-symbols-outlined text-white">admin_panel_settings</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-white">Operational Scope</p>
                    <p className="text-surface-container-highest/60">Manage enrollments & courses.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-md"
                    style={{ background: 'rgba(99,102,241,0.2)' }}>
                    <span className="material-symbols-outlined text-white">lock</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-white">Password Only</p>
                    <p className="text-surface-container-highest/60">No social providers attached.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form area */}
          <div className="flex flex-1 flex-col justify-center bg-surface-container-lowest p-8 md:p-12 lg:p-16">
            <div className="mx-auto w-full max-w-md">
              <header className="mb-8 text-center md:text-left">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(67,56,202,0.08)', color: '#4338ca' }}>
                  Administration
                </div>
                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                  Sign in to continue
                </h2>
                <p className="mt-2 text-on-surface-variant">
                  Use your staff account to enter the admin dashboard.
                </p>
              </header>

              {error ? (
                <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="email">
                    Email Address
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-[#4338ca]">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input
                      id="email"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/60 transition-all focus:border-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/20"
                      name="email"
                      placeholder="admin@academic-editorial.com"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="password">
                    Password
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-[#4338ca]">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input
                      id="password"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-12 text-on-surface placeholder:text-outline/60 transition-all focus:border-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/20"
                      name="password"
                      placeholder="••••••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-xl transition-all hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
                    boxShadow: '0 18px 30px rgba(67,56,202,0.2)',
                  }}
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Signing in...' : 'Sign in to Admin'}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </form>

              <footer className="mt-10 text-center">
                <p className="text-sm text-on-surface-variant">
                  Not an admin?{' '}
                  <Link href="/login" className="font-bold text-on-surface underline-offset-4 hover:underline">
                    Student login
                  </Link>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center py-8 opacity-40 transition-opacity hover:opacity-100">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
          © 2024 The Academic Editorial. All rights reserved.
        </p>
      </div>
    </main>
  );
}
