import Link from 'next/link';
import styles from './page.module.css';

const pendingApprovals = [
  {
    id: 'EN-1042',
    student: 'May S.',
    target: 'Excel Fundamentals Bundle',
    amount: '1,990 THB',
    submittedAt: '2 min ago',
    status: 'pending',
  },
  {
    id: 'EN-1041',
    student: 'Aof T.',
    target: 'Power Automate Bundle',
    amount: '2,490 THB',
    submittedAt: '18 min ago',
    status: 'pending',
  },
  {
    id: 'EN-1039',
    student: 'Kanya P.',
    target: 'App Sheet Starter Bundle',
    amount: '1,490 THB',
    submittedAt: '41 min ago',
    status: 'pending',
  },
];

const bundleRows = [
  { name: 'Excel Fundamentals Bundle', courses: 4, enrollments: 18, revenue: '35,820 THB' },
  { name: 'Power Automate Bundle', courses: 3, enrollments: 12, revenue: '29,880 THB' },
  { name: 'MS Access Starter Bundle', courses: 5, enrollments: 9, revenue: '17,910 THB' },
];

const studentRows = [
  { name: 'Nattapong W.', email: 'nattapong@example.com', joined: 'Mar 22', approvals: 2 },
  { name: 'Siriporn L.', email: 'siriporn@example.com', joined: 'Mar 20', approvals: 1 },
  { name: 'Preecha K.', email: 'preecha@example.com', joined: 'Mar 18', approvals: 3 },
];

export default function AdminPage() {
  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandKicker}>Course Online</p>
            <h1 className={styles.brandTitle}>Admin</h1>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin sections">
          <Link className={`${styles.navItem} ${styles.navItemActive}`} href="/admin">
            Dashboard
          </Link>
          <Link className={styles.navItem} href="/admin/enrollments">
            Enrollments
          </Link>
          <Link className={styles.navItem} href="/admin/bundles">
            Bundles
          </Link>
          <Link className={styles.navItem} href="/admin/courses">
            Courses
          </Link>
          <Link className={styles.navItem} href="/admin/students">
            Students
          </Link>
        </nav>

        <div className={styles.sidebarNote}>
          <p className={styles.noteLabel}>Operational scope</p>
          <p className={styles.noteBody}>
            Pending approvals, bundle integrity, course coverage, and student records.
          </p>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarLabel}>Today</p>
            <h2 className={styles.topbarTitle}>Enrollment queue and bundle control</h2>
          </div>

          <div className={styles.topbarActions}>
            <span className={styles.statusChip}>4 pending slips</span>
            <span className={styles.statusChipMuted}>Last sync 2 minutes ago</span>
          </div>
        </header>

        <section className={styles.metrics} aria-label="Key operational metrics">
          <div className={styles.metricBlock}>
            <p className={styles.metricLabel}>Pending enrollments</p>
            <p className={styles.metricValue}>4</p>
          </div>
          <div className={styles.metricBlock}>
            <p className={styles.metricLabel}>Bundles active</p>
            <p className={styles.metricValue}>12</p>
          </div>
          <div className={styles.metricBlock}>
            <p className={styles.metricLabel}>Approved students</p>
            <p className={styles.metricValue}>86</p>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.panelLarge}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.panelKicker}>Queue</p>
                <h3 className={styles.panelTitle}>Pending enrollments</h3>
              </div>
              <Link href="/admin/enrollments" className={styles.panelAction}>
                View all
              </Link>
            </div>

            <div className={styles.queueList}>
              {pendingApprovals.map((item) => (
                <div key={item.id} className={styles.queueRow}>
                  <div>
                    <p className={styles.queueId}>{item.id}</p>
                    <p className={styles.queueStudent}>{item.student}</p>
                  </div>
                  <div>
                    <p className={styles.queueTarget}>{item.target}</p>
                    <p className={styles.queueMeta}>{item.amount}</p>
                  </div>
                  <div>
                    <p className={styles.queueMeta}>{item.submittedAt}</p>
                    <span className={styles.queueBadge}>{item.status}</span>
                  </div>
                  <div className={styles.queueActions}>
                    <button className={styles.primaryAction} type="button">
                      Approve
                    </button>
                    <button className={styles.secondaryAction} type="button">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.sidePanel}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.panelKicker}>Bundles</p>
                <h3 className={styles.panelTitle}>Revenue snapshot</h3>
              </div>
              <Link href="/admin/bundles" className={styles.panelAction}>
                Manage
              </Link>
            </div>

            <div className={styles.bundleList}>
              {bundleRows.map((bundle) => (
                <div key={bundle.name} className={styles.bundleRow}>
                  <div>
                    <p className={styles.bundleName}>{bundle.name}</p>
                    <p className={styles.bundleMeta}>{bundle.courses} courses</p>
                  </div>
                  <div className={styles.bundleStats}>
                    <span>{bundle.enrollments} enrollments</span>
                    <strong>{bundle.revenue}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.sideNote}>
              <p className={styles.sideNoteLabel}>Action rule</p>
              <p className={styles.sideNoteBody}>
                Approve only after slip clarity, course bundle matching, and payment amount checks.
              </p>
            </div>
          </article>
        </section>

        <section className={styles.bottomGrid}>
          <article className={styles.panelLarge}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.panelKicker}>Courses</p>
                <h3 className={styles.panelTitle}>Coverage by bundle</h3>
              </div>
              <Link href="/admin/courses" className={styles.panelAction}>
                Edit courses
              </Link>
            </div>

            <div className={styles.courseRail}>
              <div className={styles.courseSummary}>
                <p className={styles.courseLabel}>Published courses</p>
                <p className={styles.courseValue}>18</p>
              </div>
              <div className={styles.courseSummary}>
                <p className={styles.courseLabel}>Draft courses</p>
                <p className={styles.courseValue}>3</p>
              </div>
              <div className={styles.courseSummary}>
                <p className={styles.courseLabel}>Preview lessons</p>
                <p className={styles.courseValue}>7</p>
              </div>
            </div>
          </article>

          <article className={styles.sidePanel}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.panelKicker}>Students</p>
                <h3 className={styles.panelTitle}>Recent registrations</h3>
              </div>
              <Link href="/admin/students" className={styles.panelAction}>
                Open list
              </Link>
            </div>

            <div className={styles.studentList}>
              {studentRows.map((student) => (
                <div key={student.email} className={styles.studentRow}>
                  <div>
                    <p className={styles.studentName}>{student.name}</p>
                    <p className={styles.studentEmail}>{student.email}</p>
                  </div>
                  <div className={styles.studentMeta}>
                    <span>{student.joined}</span>
                    <strong>{student.approvals} approved</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
