'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../_components/api';
import { clearAuthToken, readAuthToken } from '../../_components/auth-session';
import styles from './page.module.css';

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function LearnPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token = readAuthToken();
    if (!token) {
      router.replace('/login?error=session_expired');
      return;
    }

    apiFetch('/api/enrollments')
      .then((res) => {
        if (res.status === 401) {
          clearAuthToken();
          router.replace('/login?error=session_expired');
          return null;
        }
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => {
        if (!payload) return null;
        const enrollments = payload.data ?? payload;
        const approved = enrollments.find(
          (e) => e.course?.slug === slug && e.status === 'approved',
        );
        if (!approved) {
          setAccessDenied(true);
          setPageLoading(false);
          return null;
        }
        return apiFetch(`/api/courses/${slug}`);
      })
      .then((res) => {
        if (!res) return null;
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => {
        if (!payload) return;
        const data = payload.data ?? payload;
        setCourse(data);
        const lessons = [...(data.lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        if (lessons.length > 0) setActiveLesson(lessons[0]);
      })
      .catch(() => {
        setAccessDenied(true);
      })
      .finally(() => {
        setPageLoading(false);
      });
  }, [slug, router]);

  useEffect(() => {
    if (!activeLesson) return;
    setVideoLoading(true);
    setVideoError('');
    setSignedUrl(null);

    apiFetch(`/api/lessons/${activeLesson.id}/video-url`)
      .then((res) => {
        if (res.status === 403) {
          setVideoError('This lesson is not available. Check your enrollment status.');
          return null;
        }
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => {
        if (!payload) return;
        setSignedUrl(payload.signed_url);
      })
      .catch(() => {
        setVideoError('Unable to load video. Please try again.');
      })
      .finally(() => {
        setVideoLoading(false);
      });
  }, [activeLesson]);

  if (pageLoading) {
    return <div className={styles.spinner} role="status" aria-label="Loading" />;
  }

  if (accessDenied || !course) {
    return (
      <div className={styles.denied}>
        <p>You do not have access to this course.</p>
        <Link href={`/courses/${slug}`}>View course details</Link>
      </div>
    );
  }

  const lessons = [...(course.lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const activeLessonIndex = lessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = activeLessonIndex > 0 ? lessons[activeLessonIndex - 1] : null;
  const nextLesson = activeLessonIndex < lessons.length - 1 ? lessons[activeLessonIndex + 1] : null;
  const completedCount = activeLessonIndex + 1;
  const totalCount = lessons.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={styles.page}>
      {/* Top navbar */}
      <header className={styles.navbar}>
        <Link href="/" className={styles.navBrand}>
          Course Online
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/courses" className={styles.navLink}>Browse</Link>
          <Link href="/pathways" className={styles.navLink}>Pathways</Link>
        </nav>
        <div className={styles.navEnd}>
          <Link href={`/courses/${slug}`} className={styles.navBackLink}>
            ← Back to course
          </Link>
        </div>
      </header>

      <div className={styles.shell}>
        {/* Left: prev/next lesson navigation */}
        <aside className={styles.navSidebar}>
          <button
            type="button"
            className={styles.navBtn}
            disabled={!prevLesson}
            onClick={() => prevLesson && setActiveLesson(prevLesson)}
            aria-label="Previous lesson"
          >
            <span className={styles.navBtnIcon}>‹</span>
            <span className={styles.navBtnLabel}>Prev</span>
          </button>
          <button
            type="button"
            className={styles.navBtn}
            disabled={!nextLesson}
            onClick={() => nextLesson && setActiveLesson(nextLesson)}
            aria-label="Next lesson"
          >
            <span className={styles.navBtnLabel}>Next</span>
            <span className={styles.navBtnIcon}>›</span>
          </button>
        </aside>

        {/* Center: video player + lesson details */}
        <main className={styles.center}>
          {/* Video player */}
          <div className={styles.playerWrap}>
            {videoLoading ? (
              <div className={styles.playerPlaceholder} role="status" aria-label="Loading video" />
            ) : videoError ? (
              <div className={styles.playerError}>{videoError}</div>
            ) : signedUrl ? (
              <div className={styles.playerContainer}>
                <iframe
                  className={styles.playerIframe}
                  src={signedUrl}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title={activeLesson?.title ?? 'Lesson video'}
                />
                <div className={styles.playerGradient} />
              </div>
            ) : (
              <div className={styles.playerPlaceholder} />
            )}
          </div>

          {/* Lesson info */}
          {activeLesson && (
            <div className={styles.lessonInfo}>
              {course.title && (
                <p className={styles.lessonModule}>{course.title}</p>
              )}
              <h1 className={styles.lessonInfoTitle}>{activeLesson.title}</h1>
              {activeLesson.description && (
                <p className={styles.lessonDescription}>{activeLesson.description}</p>
              )}
              <div className={styles.lessonMeta}>
                {activeLesson.duration_seconds ? (
                  <span className={styles.lessonDurationBadge}>
                    {formatDuration(activeLesson.duration_seconds)}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Community section */}
          <div className={styles.communityBar}>
            <div className={styles.communityAvatars}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.communityAvatar} />
              ))}
            </div>
            <p className={styles.communityText}>
              Other scholars are currently studying this course with you.
            </p>
          </div>
        </main>

        {/* Right: curriculum sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Course Curriculum</h2>
            <div className={styles.progressRow}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {progressPct}% Complete &mdash; {completedCount}/{totalCount} Lessons
              </span>
            </div>
          </div>

          <nav className={styles.lessonList} aria-label="Course lessons">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              const isDone = idx < activeLessonIndex;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={`${styles.lessonBtn} ${isActive ? styles.lessonBtnActive : ''} ${isDone ? styles.lessonBtnDone : ''}`}
                  onClick={() => setActiveLesson(lesson)}
                >
                  <span className={styles.lessonBtnIcon}>
                    {isDone ? (
                      <span className={styles.iconCheck}>✓</span>
                    ) : isActive ? (
                      <span className={styles.iconPlay}>▶</span>
                    ) : (
                      <span className={styles.iconLock}>○</span>
                    )}
                  </span>
                  <span className={styles.lessonBtnContent}>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                    {lesson.duration_seconds ? (
                      <span className={styles.lessonDuration}>
                        {formatDuration(lesson.duration_seconds)}
                      </span>
                    ) : null}
                  </span>
                  {isActive && (
                    <span className={styles.nowPlayingBadge}>Now Playing</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className={styles.mentorCta}>
            <button type="button" className={styles.mentorBtn}>
              Chat with Mentor
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
