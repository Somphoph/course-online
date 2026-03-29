'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../_components/api';
import { readAuthToken, clearAuthToken } from '../_components/auth-session';

const STATUS_LABELS = {
  approved: 'Learning unlocked',
  pending: 'Awaiting approval',
  rejected: 'Enrolment rejected',
};

const STATUS_CLASSES = {
  approved:
    'inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-50 text-emerald-700',
  pending:
    'inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-50 text-amber-700',
  rejected:
    'inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-red-50 text-red-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = readAuthToken();

    if (!token) {
      router.replace('/login?error=session_expired');
      return;
    }

    apiFetch('/api/enrollments')
      .then((res) => {
        if (res.status === 401) {
          clearAuthToken();
          router.replace('/login?error=session_expired');
          return null;
        }

        if (!res.ok) {
          throw new Error('Unable to load enrollments.');
        }

        return res.json();
      })
      .then((payload) => {
        if (payload) {
          setError('');
          setEnrollments(payload.data ?? payload);
        }
      })
      .catch(() => {
        setError('Unable to load enrolments right now. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const approved = enrollments.filter((e) => e.status === 'approved').length;
  const pending = enrollments.filter((e) => e.status === 'pending').length;

  return (
    <main className="page-shell mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
      <section className="surface-card space-y-5 p-8">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-primary-container flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Student dashboard
          </p>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface leading-tight">
          Your learning space
        </h1>
        <p className="text-on-surface-variant leading-relaxed max-w-xl">
          Your enrolled courses, approval statuses, and next lessons to continue.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            className="btn-primary min-h-[48px] rounded-xl px-5"
            type="button"
            onClick={() => {
              clearAuthToken();
              router.replace('/login');
            }}
          >
            Sign out
          </button>
          <Link
            className="btn-ghost min-h-[48px] rounded-xl px-5 font-semibold"
            href="/"
          >
            Browse courses
          </Link>
        </div>
      </section>

      <section aria-label="Dashboard summary">
        {loading ? (
          <div className="surface-card p-8">
            <p className="text-on-surface-variant">Loading...</p>
          </div>
        ) : error ? (
          <div className="surface-card p-8">
            <p className="text-on-surface-variant">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="surface-card flex flex-col gap-2 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Total enrolments
              </p>
              <p className="text-4xl font-headline font-bold text-on-surface">
                {enrollments.length}
              </p>
            </div>
            <div className="surface-card flex flex-col gap-2 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Approved
              </p>
              <p className="text-4xl font-headline font-bold text-emerald-600">{approved}</p>
            </div>
            <div className="surface-card flex flex-col gap-2 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Pending approval
              </p>
              <p className="text-4xl font-headline font-bold text-amber-600">{pending}</p>
            </div>
          </div>
        )}
      </section>

      <section className="surface-card p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Enrolments
          </p>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Your courses</h2>
        </div>

        {loading ? (
          <p className="text-on-surface-variant mt-5">Loading...</p>
        ) : error ? (
          <p className="text-on-surface-variant mt-5">{error}</p>
        ) : enrollments.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-on-surface-variant">No enrolments yet.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Browse courses →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrollments.map((enrolment) => (
              <div
                key={enrolment.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-5"
              >
                <div className="space-y-1">
                  <p className="font-bold text-on-surface">
                    {enrolment.course?.title ?? '—'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Submitted {new Date(enrolment.created_at).toLocaleDateString('th-TH')}
                  </p>
                  {enrolment.status === 'approved' && enrolment.course?.slug ? (
                    <Link
                      href={`/learn/${enrolment.course.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-1"
                    >
                      Watch now →
                    </Link>
                  ) : null}
                </div>
                <span
                  className={
                    STATUS_CLASSES[enrolment.status] ??
                    'inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-50 text-amber-700'
                  }
                >
                  {STATUS_LABELS[enrolment.status] ?? enrolment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
