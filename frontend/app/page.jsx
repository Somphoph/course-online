'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses', { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((payload) => {
        setCourses(payload.data ?? payload);
      })
      .catch(() => {
        setCourses([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark} />
          <p className={styles.kicker}>Course Online</p>
        </div>
        <h1 className={styles.title}>Learn at your own pace</h1>
        <p className={styles.lead}>
          Courses covering Microsoft Excel, MS Access, Power Automate, and App Sheet.
          Browse below and enrol when you&apos;re ready.
        </p>
        <a href="#courses" className={styles.ctaBtn}>
          ดูคอร์สทั้งหมด →
        </a>
      </header>

      {loading ? (
        <div className={styles.empty}>
          <div className={styles.spinner} aria-hidden="true" />
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className={styles.empty}>
          <p>No courses available yet. Check back soon.</p>
        </div>
      ) : (
        <div id="courses" className={styles.grid}>
          {courses.map((course) => (
            <Link key={course.slug} href={`/courses/${course.slug}`} className={styles.card}>
              {course.thumbnail ? (
                <img
                  className={styles.cardThumbnail}
                  src={course.thumbnail}
                  alt={course.title}
                />
              ) : (
                <div className={styles.cardThumbnail} role="presentation" />
              )}
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{course.title}</p>
                <p className={styles.cardDesc}>{course.description}</p>
                <p className={styles.cardPrice}>
                  {Number(course.price).toLocaleString('th-TH')} THB
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
