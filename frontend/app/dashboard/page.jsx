'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../_components/api';
import { readAuthToken, clearAuthToken } from '../_components/auth-session';
import styles from './page.module.css';

const STATUS_LABELS = {
  approved: 'Learning unlocked',
  pending: 'Awaiting approval',
  rejected: 'Enrolment rejected',
};

const STATUS_CLASSES = {
  approved: styles.statusApproved,
  pending: styles.statusPending,
  rejected: styles.statusRejected,
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
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark} />
          <p className={styles.brandKicker}>Student dashboard</p>
        </div>

        <h1 className={styles.title}>Your learning space</h1>
        <p className={styles.lead}>
          Your enrolled courses, approval statuses, and next lessons to continue.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.primaryLink}
            type="button"
            onClick={() => {
              clearAuthToken();
              router.replace('/login');
            }}
          >
            Sign out
          </button>
          <Link className={styles.secondaryLink} href="/">
            Browse courses
          </Link>
        </div>
      </section>

      <section className={styles.grid} aria-label="Dashboard summary">
        <article className={styles.panel}>
          <p className={styles.kicker}>Status</p>
          <h2 className={styles.panelTitle}>Account overview</h2>
          {loading ? (
            <p style={{ color: 'rgba(25,28,34,0.56)', marginTop: 20 }}>Loading...</p>
          ) : error ? (
            <p style={{ color: 'rgba(25,28,34,0.56)', marginTop: 20 }}>{error}</p>
          ) : (
            <div className={styles.stats}>
              <div>
                <p className={styles.statValue}>{enrollments.length}</p>
                <p className={styles.statLabel}>Total enrolments</p>
              </div>
              <div>
                <p className={styles.statValue}>{approved}</p>
                <p className={styles.statLabel}>Approved</p>
              </div>
              <div>
                <p className={styles.statValue}>{pending}</p>
                <p className={styles.statLabel}>Pending approval</p>
              </div>
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <p className={styles.kicker}>Enrolments</p>
          <h2 className={styles.panelTitle}>Your courses</h2>
          {loading ? (
            <p style={{ color: 'rgba(25,28,34,0.56)', marginTop: 20 }}>Loading...</p>
          ) : error ? (
            <p style={{ color: 'rgba(25,28,34,0.56)', marginTop: 20 }}>{error}</p>
          ) : enrollments.length === 0 ? (
            <p style={{ color: 'rgba(25,28,34,0.56)', marginTop: 20 }}>
              No enrolments yet.{' '}
              <Link href="/" style={{ color: '#006adc' }}>
                Browse courses
              </Link>
            </p>
          ) : (
            <div className={styles.courseList}>
              {enrollments.map((enrolment) => (
                <div key={enrolment.id} className={styles.courseRow}>
                  <div>
                    <p className={styles.courseTitle}>{enrolment.course?.title ?? '—'}</p>
                    <p className={styles.courseMeta}>
                      Submitted {new Date(enrolment.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <span className={STATUS_CLASSES[enrolment.status] ?? styles.statusPending}>
                    {STATUS_LABELS[enrolment.status] ?? enrolment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
