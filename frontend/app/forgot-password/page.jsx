'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    <main className="page-shell flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="surface-panel p-8 md:p-12">
          <div className="mb-8 flex justify-center" aria-hidden="true">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-primary text-3xl font-body">
              &#x1F512;
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="section-title mb-4 text-3xl font-bold">
              Forgot Password
            </h1>
            <p className="section-copy">
              No worries, it happens. Enter your email and we&rsquo;ll send you a link to reset it.
            </p>
          </div>

          {sent ? (
            <p className="status-banner-success text-center">
              Reset link sent. Check your email inbox (and spam folder).
            </p>
          ) : (
            <>
              {error ? (
                <p className="status-banner-error mb-6">
                  {error}
                </p>
              ) : null}
              <form className="space-y-6" onSubmit={handleSubmit} data-page="forgot-password">
                <div className="field-grid">
                  <label className="field-label ml-1 block text-on-surface-variant" htmlFor="fp-email">
                    Email Address
                  </label>
                  <input
                    id="fp-email"
                    className="field-input w-full placeholder:text-outline/60"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary w-full py-4"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 text-center">
            <Link
              className="inline-flex items-center gap-2 text-primary font-semibold font-body no-underline hover:text-primary-container transition-colors"
              href="/login"
            >
              <span aria-hidden="true" className="text-lg leading-none">&larr;</span>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
