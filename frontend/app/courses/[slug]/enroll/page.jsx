'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readAuthToken } from '../../../_components/auth-session';
import styles from './page.module.css';

const BANK_INFO = {
  bank: 'กสิกรไทย (KBank)',
  accountName: 'บริษัท คอร์ส ออนไลน์ จำกัด',
  accountNumber: 'XXX-X-XXXXX-X',
};

export default function EnrollPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const fileRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect unauthenticated users
  useEffect(() => {
    if (!readAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  // Fetch course info to show the course title
  useEffect(() => {
    fetch(`/api/courses/${slug}`, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((payload) => setCourse(payload.data ?? payload))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const file = fileRef.current?.files?.[0];

    if (!file) {
      setError('Please select your bank transfer slip image.');
      return;
    }

    if (!course?.id) {
      setError('Course information is missing. Please refresh and try again.');
      return;
    }

    setSubmitting(true);

    try {
      const token = readAuthToken();
      const body = new FormData();
      body.append('course_id', course.id);
      body.append('slip_image', file);

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'Enrolment failed. Please try again.');
        return;
      }

      setSuccess('Enrolment submitted! We will review your slip and notify you shortly.');

      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
    } catch {
      setError('Cannot reach the service right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.spinner} role="status" aria-label="Loading" />;
  }

  return (
    <div className={styles.shell}>
      <Link href={`/courses/${slug}`} className={styles.back}>
        ← Back to course
      </Link>

      <div className={styles.card}>
        <p className={styles.kicker}>Enrolment</p>
        <h1 className={styles.title}>Upload payment slip</h1>
        <p className={styles.lead}>
          Transfer the course fee to our bank account, then upload a photo or screenshot of your
          transfer slip below. We will approve your enrolment within 1 business day.
        </p>

        {course?.title ? (
          <p className={styles.courseTitle}>{course.title}</p>
        ) : null}

        <div className={styles.bankBox}>
          <p className={styles.bankBoxTitle}>โอนเงินมาที่</p>
          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>ธนาคาร</span>
            <span className={styles.bankValue}>{BANK_INFO.bank}</span>
          </div>
          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>ชื่อบัญชี</span>
            <span className={styles.bankValue}>{BANK_INFO.accountName}</span>
          </div>
          <div className={styles.bankRow}>
            <span className={styles.bankLabel}>เลขบัญชี</span>
            <span className={styles.bankValue}>{BANK_INFO.accountNumber}</span>
          </div>
        </div>

        {error ? <p className={styles.alert}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Transfer slip image</span>
            <input
              ref={fileRef}
              className={styles.fileInput}
              type="file"
              accept="image/*"
              required
              disabled={submitting || !!success}
            />
            <span className={styles.hint}>JPG, PNG, or WEBP. Max 2 MB.</span>
          </label>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={submitting || !!success}
          >
            {submitting ? 'Submitting...' : 'Submit enrolment'}
          </button>
        </form>
      </div>
    </div>
  );
}
