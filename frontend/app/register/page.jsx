'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuthToken, fetchCurrentUser, readAuthToken, writeAuthToken } from '../_components/auth-session';
import { resolveDestinationForRole } from '../_components/auth-flow.mjs';

const GOOGLE_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCYiMJcf0WdvHxuhWw3_snRv9Qt62yZx2tBAqGTEP2TZPbiY3GhFopvQQ1p800_Fg1UAtLd1EOyO8qzkBd1sPUu4JnwkSPFBDPEqDJfjZLtMPBLgWWTrg16I-aBxQ1XJQtZIzh5jrSdw1wxAQxyKkFMkSnRKW52DpSKfNE1ukhXLOAiXsHwxtXcL3hM0R3tLbxK5MNC9u0bGwFq04qdQgr9-w3tL9x04HZXcnV1R-Yukk-MX0KVA57P2FHEyKIF1rNQTZ7pHQPZf5o';
const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDV01dIOl1KyxrpGxtsIOSzi6Ebim76lojiOQOExLyj76g4UoFgPzd9AI24_Rm0r1AZHT3mrxMpaGcDkNEeQW464bXSTfaKwU0e0H1r0KNWkL6Vrh1nuhDJL0Cf5xQkHBQJwRvyJyxANZu4Huo_V7Qpht00CTlBMW05pV9VetKCAqr72zTlfz08YcWQ7RpO_yFmhy2BkmjTeyZTIgY6rJUV1X29JJET35htd0rvZLWRJt2GcGcHi8lrhfWRTbdZxqDblHmKtL4I0_g';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordHint =
    form.password && form.password.length < 8 ? 'Password must be at least 8 characters.' : '';

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
        router.replace(resolveDestinationForRole(user.role));
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
      <main className="grid min-h-screen place-items-center bg-background p-8">
        <section className="w-full max-w-[480px] rounded-[28px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_40px_rgba(25,28,34,0.08)]">
          <div
            className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-primary/12 border-t-primary-container"
            aria-hidden="true"
          />
          <h1 className="m-0 font-headline text-[1.8rem] font-bold text-on-surface">Checking session</h1>
          <p className="mt-2 text-on-surface/72">Verifying your current login before showing the form.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background font-body text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-surface-container-low shadow-2xl shadow-on-surface/5 md:flex-row">
          {/* Left: dark image panel */}
          <div className="relative hidden overflow-hidden bg-inverse-surface md:flex md:w-5/12 lg:w-1/2">
            <div className="absolute inset-0 opacity-60">
              <img alt="Atmospheric study space" className="h-full w-full object-cover" src={HERO_IMAGE} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-between p-12">
              <div>
                <h1 className="font-headline text-3xl font-extrabold leading-none tracking-tighter text-white">
                  The Academic Editorial
                </h1>
                <p className="mt-4 max-w-xs font-medium text-surface-container-highest/80">
                  Elevating the standards of digital scholarship through curated learning pathways.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                    <span className="material-symbols-outlined">auto_stories</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-white">Curated Content</p>
                    <p className="text-surface-container-highest/60">Expertly edited resources.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                    <span className="material-symbols-outlined">workspace_premium</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-white">Verified Mentors</p>
                    <p className="text-surface-container-highest/60">Learn from world-class editors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form area */}
          <div className="flex flex-1 flex-col justify-center bg-surface-container-lowest p-8 md:p-12 lg:p-16">
            {/* Tab selector — Register active */}
            <div className="mb-10 flex w-fit self-center rounded-xl bg-surface-container-low p-1.5">
              <Link
                href="/login"
                className="px-8 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:text-on-surface"
              >
                Log In
              </Link>
              <button
                className="rounded-lg bg-white px-8 py-2.5 text-sm font-bold text-primary shadow-sm transition-all"
                type="button"
              >
                Register
              </button>
            </div>

            <div className="mx-auto w-full max-w-md">
              <header className="mb-8 text-center md:text-left">
                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                  Create your account
                </h2>
                <p className="mt-2 text-on-surface-variant">
                  Join thousands of learners on the platform.
                </p>
              </header>

              {status ? (
                <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-teal-700">
                  {status}
                </p>
              ) : null}
              {error ? (
                <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}

              {/* Social login */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 transition-all hover:bg-surface-container hover:shadow-sm active:scale-95"
                  disabled={loading}
                  type="button"
                  onClick={() => socialLogin('google')}
                >
                  <img alt="Google Logo" className="h-5 w-5" src={GOOGLE_LOGO} />
                  <span className="text-sm font-semibold text-on-surface">Google</span>
                </button>
                <button
                  className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 transition-all hover:bg-surface-container hover:shadow-sm active:scale-95"
                  disabled={loading}
                  type="button"
                  onClick={() => socialLogin('facebook')}
                >
                  <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-semibold text-on-surface">Facebook</span>
                </button>
              </div>

              <div className="relative mb-8 flex items-center justify-center">
                <div className="w-full border-t border-outline-variant/30" />
                <span className="absolute bg-surface-container-lowest px-4 text-xs font-bold uppercase tracking-widest text-outline">
                  or continue with
                </span>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Full name */}
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="name">
                    Full Name
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <input
                      id="name"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      name="name"
                      placeholder="Your full name"
                      type="text"
                      autoComplete="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="email">
                    Email Address
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input
                      id="email"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      name="email"
                      placeholder="scholar@academic-editorial.com"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="phone">
                    Phone Number
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">phone</span>
                    </div>
                    <input
                      id="phone"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="password">
                    Password
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input
                      id="password"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-12 text-on-surface placeholder:text-outline/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      name="password"
                      placeholder="••••••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
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
                  {passwordHint ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-error-container bg-error-container/50 px-3 py-1.5 text-on-error-container">
                      <span className="material-symbols-outlined text-sm">info</span>
                      <span className="text-[11px] font-bold">{passwordHint}</span>
                    </div>
                  ) : null}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-on-surface" htmlFor="password_confirmation">
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </div>
                    <input
                      id="password_confirmation"
                      className="w-full rounded-xl border-transparent bg-surface-container-low py-3.5 pl-12 pr-12 text-on-surface placeholder:text-outline/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      name="password_confirmation"
                      placeholder="••••••••••••"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={form.password_confirmation}
                      onChange={handleChange}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  className="editorial-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </form>

              <footer className="mt-10 text-center">
                <p className="text-sm text-on-surface-variant">
                  By continuing, you agree to our{' '}
                  <a className="font-bold text-on-surface underline-offset-4 hover:underline" href="#">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a className="font-bold text-on-surface underline-offset-4 hover:underline" href="#">
                    Privacy Policy
                  </a>
                  .
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
