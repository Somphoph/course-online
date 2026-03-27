'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../_components/api';
import AdminShell from './admin-shell';
import styles from './page.module.css';

export default function AdminPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  function loadEnrollments() {
    setLoading(true);
    apiFetch('/api/admin/enrollments?status=pending')
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => {
        setEnrollments(payload.data ?? payload);
      })
      .catch(() => {
        setEnrollments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadEnrollments();
  }, []);

  function handleApprove(id) {
    setActionError('');
    apiFetch(`/api/admin/enrollments/${id}/approve`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('action_failed');
        loadEnrollments();
      })
      .catch(() => {
        setActionError('Action failed. Please try again.');
      });
  }

  function handleReject(id) {
    setActionError('');
    apiFetch(`/api/admin/enrollments/${id}/reject`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('action_failed');
        loadEnrollments();
      })
      .catch(() => {
        setActionError('Action failed. Please try again.');
      });
  }

  return (
    <AdminShell>
      <header className={styles.topbar}>
        <div>
          <p className={styles.topbarLabel}>Enrollments</p>
          <h2 className={styles.topbarTitle}>Pending approvals</h2>
        </div>
        {enrollments.length > 0 && (
          <div className={styles.topbarActions}>
            <span className={styles.statusChip}>{enrollments.length} pending</span>
          </div>
        )}
      </header>

      {actionError ? (
        <p style={{ color: '#b91c1c', padding: '0 32px', margin: '8px 0' }}>{actionError}</p>
      ) : null}

      <section style={{ padding: '0 32px 32px' }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', paddingTop: 24 }}>Loading...</p>
        ) : enrollments.length === 0 ? (
          <p style={{ color: 'var(--muted)', paddingTop: 24 }}>No pending enrollments.</p>
        ) : (
          <div className={styles.queueList}>
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className={styles.queueRow}>
                <div>
                  <p className={styles.queueId}>#{enrollment.id}</p>
                  <p className={styles.queueStudent}>{enrollment.user?.name ?? '—'}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '2px 0 0' }}>
                    {enrollment.user?.email}
                  </p>
                </div>
                <div>
                  <p className={styles.queueTarget}>{enrollment.course?.title ?? '—'}</p>
                  <p className={styles.queueMeta}>
                    {enrollment.course?.price
                      ? `${Number(enrollment.course.price).toLocaleString('th-TH')} THB`
                      : ''}
                  </p>
                </div>
                <div>
                  <p className={styles.queueMeta}>
                    {new Date(enrollment.created_at).toLocaleDateString('th-TH')}
                  </p>
                  <a
                    href={`/api/admin/enrollments/${enrollment.id}/slip`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: 'var(--accent)' }}
                  >
                    View slip ↗
                  </a>
                </div>
                <div className={styles.queueActions}>
                  <button
                    className={styles.primaryAction}
                    type="button"
                    onClick={() => handleApprove(enrollment.id)}
                  >
                    Approve
                  </button>
                  <button
                    className={styles.secondaryAction}
                    type="button"
                    onClick={() => handleReject(enrollment.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
