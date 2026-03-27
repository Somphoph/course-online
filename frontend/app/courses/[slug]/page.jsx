'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import styles from './page.module.css';

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function CourseDetailPage({ params }) {
  const { slug } = use(params);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((payload) => {
        if (payload) {
          setCourse(payload.data ?? payload);
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className={styles.spinner} role="status" aria-label="Loading" />;
  }

  if (notFound || !course) {
    return (
      <div className={styles.shell}>
        <div className={styles.empty}>
          <p>Course not found.</p>
          <Link href="/">Browse all courses</Link>
        </div>
      </div>
    );
  }

  const lessons = course.lessons ?? [];

  return (
    <div className={styles.shell}>
      <Link href="/" className={styles.back}>
        ← All courses
      </Link>

      <div className={styles.layout}>
        <section className={styles.hero}>
          {course.thumbnail ? (
            <img
              className={styles.heroThumb}
              src={course.thumbnail}
              alt={course.title}
            />
          ) : (
            <div className={styles.heroThumb} role="presentation" />
          )}
          <p className={styles.kicker}>Course</p>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.priceRow}>
            <span className={styles.price}>
              {Number(course.price).toLocaleString('th-TH')} THB
            </span>
            <Link href={`/courses/${course.slug}/enroll`} className={styles.enrollButton}>
              Enrol now
            </Link>
          </div>
        </section>

        {lessons.length > 0 && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Course content ({lessons.length} lesson{lessons.length !== 1 ? 's' : ''})
            </h2>
            <div className={styles.lessonList}>
              {lessons
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((lesson) => (
                  <div key={lesson.id} className={styles.lessonRow}>
                    <p className={styles.lessonTitle}>{lesson.title}</p>
                    <div className={styles.lessonMeta}>
                      {lesson.duration_seconds ? (
                        <span className={styles.duration}>
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      ) : null}
                      {lesson.is_preview ? (
                        <span className={styles.previewBadge}>Preview</span>
                      ) : (
                        <span className={styles.lockBadge}>Enrolled</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
