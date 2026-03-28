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

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={`/courses/${slug}`} className={styles.back}>
            ← {course.title}
          </Link>
        </div>
        <nav className={styles.lessonList} aria-label="Course lessons">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              className={`${styles.lessonBtn} ${activeLesson?.id === lesson.id ? styles.lessonBtnActive : ''}`}
              onClick={() => setActiveLesson(lesson)}
            >
              <span className={styles.lessonTitle}>{lesson.title}</span>
              {lesson.duration_seconds ? (
                <span className={styles.lessonDuration}>
                  {formatDuration(lesson.duration_seconds)}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.player}>
        {videoLoading ? (
          <div className={styles.playerPlaceholder} role="status" aria-label="Loading video" />
        ) : videoError ? (
          <div className={styles.playerError}>{videoError}</div>
        ) : signedUrl ? (
          <iframe
            className={styles.playerIframe}
            src={signedUrl}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={activeLesson?.title ?? 'Lesson video'}
          />
        ) : (
          <div className={styles.playerPlaceholder} />
        )}
        {activeLesson && (
          <div className={styles.lessonInfo}>
            <h1 className={styles.lessonInfoTitle}>{activeLesson.title}</h1>
            {activeLesson.duration_seconds ? (
              <p className={styles.lessonInfoMeta}>
                {formatDuration(activeLesson.duration_seconds)}
              </p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
