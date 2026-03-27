'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../_components/api';
import AdminShell from './admin-shell';
import styles from './page.module.css';

export default function AdminPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

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
    setActionLoading(id);
    apiFetch(`/api/admin/enrollments/${id}/approve`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('action_failed');
        loadEnrollments();
      })
      .catch(() => {
        setActionError('Action failed. Please try again.');
      })
      .finally(() => {
        setActionLoading(null);
      });
  }

  function handleReject(id) {
    setActionError('');
    setActionLoading(id);
    apiFetch(`/api/admin/enrollments/${id}/reject`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('action_failed');
        loadEnrollments();
      })
      .catch(() => {
        setActionError('Action failed. Please try again.');
      })
      .finally(() => {
        setActionLoading(null);
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
                  <button
                    type="button"
                    style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      apiFetch(`/api/admin/enrollments/${enrollment.id}/slip`)
                        .then((res) => {
                          if (!res.ok) throw new Error('slip_failed');
                          return res.blob();
                        })
                        .then((blob) => {
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        })
                        .catch(() => {
                          setActionError('Unable to load slip image.');
                        });
                    }}
                  >
                    View slip ↗
                  </button>
                </div>
                <div className={styles.queueActions}>
                  <button
                    className={styles.primaryAction}
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => handleApprove(enrollment.id)}
                  >
                    {actionLoading === enrollment.id ? '...' : 'Approve'}
                  </button>
                  <button
                    className={styles.secondaryAction}
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() => handleReject(enrollment.id)}
                  >
                    {actionLoading === enrollment.id ? '...' : 'Reject'}
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
