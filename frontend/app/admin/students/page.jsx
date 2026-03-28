'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../_components/api';
import AdminShell from '../admin-shell';
import styles from './page.module.css';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiFetch('/api/admin/students')
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => setStudents(payload.data ?? payload))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const totalEnrollments = students.reduce((sum, s) => sum + (s.enrollment_count ?? 0), 0);

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <AdminShell>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.pageKicker}>Community</p>
          <h1 className={styles.pageTitle}>Student List</h1>
          <p className={styles.pageDesc}>Manage registered students and their enrollments</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Students</p>
          <p className={styles.statValue}>{loading ? '—' : students.length.toLocaleString()}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Enrollments</p>
          <p className={styles.statValue}>{loading ? '—' : totalEnrollments.toLocaleString()}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Avg. Enrollments</p>
          <p className={styles.statValue}>
            {loading || students.length === 0
              ? '—'
              : (totalEnrollments / students.length).toFixed(1)}
          </p>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading students...</p>
      ) : students.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No students yet</p>
          <p className={styles.emptyDesc}>Students will appear here once they register.</p>
        </div>
      ) : (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>All Students</h2>
            <span className={styles.countChip}>{students.length} total</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Student</th>
                  <th className={styles.th}>Phone</th>
                  <th className={styles.th}>Registered</th>
                  <th className={styles.th}>Enrollments</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <>
                    <tr
                      key={student.id}
                      className={`${styles.tr} ${expandedId === student.id ? styles.trExpanded : ''}`}
                      onClick={() => toggleExpand(student.id)}
                    >
                      <td className={styles.td}>
                        <div className={styles.studentCell}>
                          <div className={styles.avatar}>
                            {(student.name ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className={styles.studentName}>{student.name}</p>
                            <p className={styles.studentEmail}>{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <p className={styles.phoneText}>{student.phone ?? '—'}</p>
                      </td>
                      <td className={styles.td}>
                        <p className={styles.dateText}>
                          {new Date(student.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.enrollBadge} ${student.enrollment_count > 0 ? styles.enrollBadgeActive : ''}`}>
                          {student.enrollment_count} enrolment{student.enrollment_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.expandIcon}>
                          {expandedId === student.id ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                    {expandedId === student.id && (
                      <tr key={`${student.id}-expanded`} className={styles.expandedRow}>
                        <td colSpan={5} className={styles.expandedCell}>
                          <div className={styles.expandedContent}>
                            <p className={styles.expandedLabel}>Student ID: #{student.id}</p>
                            <p className={styles.expandedText}>
                              {student.enrollment_count === 0
                                ? 'This student has no active enrollments.'
                                : `${student.enrollment_count} course enrolment${student.enrollment_count !== 1 ? 's' : ''} on record.`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            <p className={styles.footerText}>
              Showing {students.length} of {students.length} students
            </p>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
