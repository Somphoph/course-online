import Link from 'next/link';
import styles from './page.module.css';

const courseRows = [
  {
    title: 'Excel Fundamentals Bundle',
    meta: '4 courses available',
    status: 'Learning path ready',
  },
  {
    title: 'Power Automate Bundle',
    meta: '3 courses available',
    status: 'Waiting for approval',
  },
  {
    title: 'App Sheet Starter Bundle',
    meta: '5 courses available',
    status: 'Preview lessons unlocked',
  },
];

export default function DashboardPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark} />
          <p className={styles.brandKicker}>Student dashboard</p>
        </div>

        <h1 className={styles.title}>Your learning space</h1>
        <p className={styles.lead}>
          A simple home for enrolled courses, approval status, and the next lesson to continue.
        </p>

        <div className={styles.actions}>
          <Link className={styles.primaryLink} href="/login">
            Switch account
          </Link>
          <Link className={styles.secondaryLink} href="/courses">
            Browse courses
          </Link>
        </div>
      </section>

      <section className={styles.grid} aria-label="Dashboard summary">
        <article className={styles.panel}>
          <p className={styles.kicker}>Status</p>
          <h2 className={styles.panelTitle}>Account overview</h2>
          <div className={styles.stats}>
            <div>
              <p className={styles.statValue}>3</p>
              <p className={styles.statLabel}>Active bundles</p>
            </div>
            <div>
              <p className={styles.statValue}>1</p>
              <p className={styles.statLabel}>Pending approval</p>
            </div>
            <div>
              <p className={styles.statValue}>7</p>
              <p className={styles.statLabel}>Preview lessons</p>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <p className={styles.kicker}>Continue</p>
          <h2 className={styles.panelTitle}>Your bundles</h2>
          <div className={styles.courseList}>
            {courseRows.map((course) => (
              <div key={course.title} className={styles.courseRow}>
                <div>
                  <p className={styles.courseTitle}>{course.title}</p>
                  <p className={styles.courseMeta}>{course.meta}</p>
                </div>
                <span className={styles.courseStatus}>{course.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
