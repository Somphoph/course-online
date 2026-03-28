'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const featuredCourse = courses[0];
  const supportingCourses = courses.slice(1);

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
      <section className={styles.hero}>
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
          <div className={styles.heroActions}>
            <a href="#courses" className={styles.ctaBtn}>
              View all courses →
            </a>
            <p className={styles.heroMeta}>
              Self-paced lessons, clear pricing, and a direct handoff into checkout.
            </p>
          </div>
        </header>

        <aside className={styles.heroPanel} aria-label="Featured course preview">
          {loading ? (
            <div className={styles.heroLoading}>
              <div className={styles.spinner} aria-hidden="true" />
              <p>Loading courses...</p>
            </div>
          ) : featuredCourse ? (
            <Link href={`/courses/${featuredCourse.slug}`} className={styles.featuredCard}>
              <div className={styles.featuredMedia}>
                {featuredCourse.thumbnail ? (
                  <img
                    className={styles.featuredImage}
                    src={featuredCourse.thumbnail}
                    alt={featuredCourse.title}
                  />
                ) : (
                  <div className={styles.featuredImage} role="presentation" />
                )}
              </div>
              <div className={styles.featuredBody}>
                <p className={styles.featuredKicker}>Featured course</p>
                <h2 className={styles.featuredTitle}>{featuredCourse.title}</h2>
                <p className={styles.featuredDesc}>{featuredCourse.description}</p>
                <div className={styles.featuredFooter}>
                  <span className={styles.priceTag}>
                    {Number(featuredCourse.price).toLocaleString('th-TH')} THB
                  </span>
                  <span className={styles.featuredLink}>Open course</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className={styles.heroLoading}>
              <p>No courses available yet. Check back soon.</p>
            </div>
          )}

          <div className={styles.heroNotes}>
            <article className={styles.noteCard}>
              <p className={styles.noteLabel}>Format</p>
              <p className={styles.noteBody}>Self-paced lessons with practical assignments.</p>
            </article>
            <article className={styles.noteCard}>
              <p className={styles.noteLabel}>Support</p>
              <p className={styles.noteBody}>Straightforward checkout and dashboard handoff.</p>
            </article>
          </div>
        </aside>
      </section>

      <section id="courses" className={styles.catalog}>
        <div className={styles.catalogHeader}>
          <div>
            <p className={styles.catalogKicker}>Course catalog</p>
            <h2 className={styles.catalogTitle}>Browse by topic</h2>
          </div>
          <p className={styles.catalogLead}>
            The page keeps one featured course up top, then surfaces the remaining courses below.
          </p>
        </div>

        {!loading && supportingCourses.length > 0 ? (
          <div className={styles.grid}>
            {supportingCourses.map((course) => (
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
        ) : null}
      </section>
    </div>
  );
}
