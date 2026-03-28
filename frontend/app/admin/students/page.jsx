'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../_components/api';
import AdminShell from '../admin-shell';
import styles from './page.module.css';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminShell>
      <header className={styles.topbar}>
        <div>
          <p className={styles.topbarLabel}>Students</p>
          <h2 className={styles.topbarTitle}>All students</h2>
        </div>
        {!loading && (
          <span className={styles.count}>{students.length} total</span>
        )}
      </header>

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : students.length === 0 ? (
        <p className={styles.empty}>No students registered yet.</p>
      ) : (
        <div className={styles.studentList}>
          {students.map((student) => (
            <div key={student.id} className={styles.studentRow}>
              <div className={styles.studentInfo}>
                <p className={styles.studentName}>{student.name}</p>
                <p className={styles.studentEmail}>{student.email}</p>
                {student.phone ? (
                  <p className={styles.studentPhone}>{student.phone}</p>
                ) : null}
              </div>
              <div className={styles.studentMeta}>
                <p className={styles.joined}>
                  Joined {new Date(student.created_at).toLocaleDateString('th-TH')}
                </p>
                <p className={styles.enrollmentCount}>
                  {student.enrollment_count} enrolment{student.enrollment_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
