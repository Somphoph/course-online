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
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.pageKicker}>Enrollments</p>
          <h1 className={styles.pageTitle}>Enrollment Management</h1>
          <p className={styles.pageDesc}>Review and process student payment verifications</p>
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <span className={styles.metricIcon}>⏳</span>
          <div>
            <p className={styles.metricLabel}>Total Pending</p>
            <p className={styles.metricValue}>{loading ? '—' : enrollments.length}</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconGreen}`}>✓</span>
          <div>
            <p className={styles.metricLabel}>Awaiting Review</p>
            <p className={styles.metricValue}>{loading ? '—' : enrollments.length}</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconRed}`}>✕</span>
          <div>
            <p className={styles.metricLabel}>Action Required</p>
            <p className={styles.metricValue}>{loading ? '—' : enrollments.length > 0 ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {actionError ? (
        <p className={styles.errorBanner}>{actionError}</p>
      ) : null}

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Pending Approvals</h2>
          {enrollments.length > 0 && (
            <span className={styles.badge}>{enrollments.length} pending</span>
          )}
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading enrollments...</p>
        ) : enrollments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No pending enrollments</p>
            <p className={styles.emptySubtext}>All enrollment requests have been processed.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Student</th>
                  <th className={styles.th}>Course</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th}>Slip</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.studentCell}>
                        <div className={styles.avatar}>
                          {(enrollment.user?.name ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.studentName}>{enrollment.user?.name ?? '—'}</p>
                          <p className={styles.studentEmail}>{enrollment.user?.email ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <p className={styles.courseName}>{enrollment.course?.title ?? '—'}</p>
                    </td>
                    <td className={styles.td}>
                      <p className={styles.dateText}>
                        {new Date(enrollment.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </td>
                    <td className={styles.td}>
                      <p className={styles.amountText}>
                        {enrollment.course?.price
                          ? `${Number(enrollment.course.price).toLocaleString('th-TH')} THB`
                          : '—'}
                      </p>
                    </td>
                    <td className={styles.td}>
                      <button
                        type="button"
                        className={styles.slipBtn}
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
                        View ↗
                      </button>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.approveBtn}
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleApprove(enrollment.id)}
                        >
                          {actionLoading === enrollment.id ? '...' : 'Approve'}
                        </button>
                        <button
                          className={styles.rejectBtn}
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleReject(enrollment.id)}
                        >
                          {actionLoading === enrollment.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
