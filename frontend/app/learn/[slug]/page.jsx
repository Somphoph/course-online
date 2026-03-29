'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../_components/api';
import { clearAuthToken, readAuthToken } from '../../_components/auth-session';

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
    return (
      <div className="grid min-h-screen place-items-center bg-background" role="status" aria-label="Loading">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px]"
          style={{ borderColor: 'rgba(0,106,220,0.18)', borderTopColor: '#006adc' }}
        />
      </div>
    );
  }

  if (accessDenied || !course) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 py-12">
        <div className="grid max-w-lg gap-4 rounded-[28px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_40px_rgba(25,28,34,0.08)]">
          <p className="m-0 text-base leading-relaxed text-on-surface/72">
            You do not have access to this course.
          </p>
          <div>
            <Link
              href={`/courses/${slug}`}
              className="inline-flex min-h-12 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white no-underline transition-transform hover:-translate-y-px"
            >
              View course details
            </Link>
          </div>
        </div>
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-6 border-b border-on-surface/10 bg-white/85 px-4 backdrop-blur md:px-8">
        <Link
          href="/"
          className="shrink-0 font-headline text-base font-bold text-on-surface no-underline transition-colors hover:text-primary"
        >
          Course Online
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          <Link
            href="/courses"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface/68 no-underline transition-colors hover:bg-primary/5 hover:text-primary"
          >
            Browse
          </Link>
          <Link
            href="/pathways"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface/68 no-underline transition-colors hover:bg-primary/5 hover:text-primary"
          >
            Pathways
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href={`/courses/${slug}`}
            className="text-sm font-medium text-primary no-underline transition-colors hover:text-primary/80"
          >
            ← Back to course
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-visible lg:h-[calc(100vh-4rem)] lg:flex-row lg:overflow-hidden">
        <aside className="flex w-full shrink-0 items-center justify-between gap-3 border-b border-on-surface/10 bg-white/80 px-4 py-3 lg:w-20 lg:flex-col lg:justify-center lg:border-b-0 lg:border-r lg:px-2">
          <button
            type="button"
            className="flex min-w-24 items-center justify-center gap-2 rounded-2xl border border-on-surface/12 px-4 py-3 text-on-surface transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 lg:min-w-0 lg:flex-col lg:px-2"
            disabled={!prevLesson}
            onClick={() => prevLesson && setActiveLesson(prevLesson)}
            aria-label="Previous lesson"
          >
            <span className="text-xl leading-none">‹</span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em]">Prev</span>
          </button>
          <button
            type="button"
            className="flex min-w-24 items-center justify-center gap-2 rounded-2xl border border-on-surface/12 px-4 py-3 text-on-surface transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 lg:min-w-0 lg:flex-col lg:px-2"
            disabled={!nextLesson}
            onClick={() => nextLesson && setActiveLesson(nextLesson)}
            aria-label="Next lesson"
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em]">Next</span>
            <span className="text-xl leading-none">›</span>
          </button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
          <div className="w-full shrink-0">
            {videoLoading ? (
              <div className="aspect-video w-full animate-pulse rounded-3xl bg-on-surface/[0.08]" role="status" aria-label="Loading video" />
            ) : videoError ? (
              <div className="flex aspect-video w-full items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center text-sm text-red-700">
                {videoError}
              </div>
            ) : signedUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-[0_12px_36px_rgba(25,28,34,0.16)]">
                <iframe
                  className="absolute inset-0 h-full w-full border-0"
                  src={signedUrl}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title={activeLesson?.title ?? 'Lesson video'}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
              </div>
            ) : (
              <div className="aspect-video w-full animate-pulse rounded-3xl bg-on-surface/[0.08]" />
            )}
          </div>

          {activeLesson && (
            <div className="grid gap-2">
              {course.title && (
                <p className="m-0 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-primary">
                  {course.title}
                </p>
              )}
              <h1 className="m-0 font-headline text-[clamp(1.6rem,2.6vw,2.3rem)] font-bold leading-tight text-on-surface">
                {activeLesson.title}
              </h1>
              {activeLesson.description && (
                <p className="m-0 max-w-[68ch] text-sm leading-relaxed text-on-surface/68 md:text-[0.95rem]">
                  {activeLesson.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {activeLesson.duration_seconds ? (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[0.78rem] font-semibold text-primary">
                    {formatDuration(activeLesson.duration_seconds)}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 rounded-2xl border border-on-surface/8 bg-white/70 px-5 py-4">
            <div className="flex shrink-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="-ml-2 h-8 w-8 rounded-full border-2 border-white first:ml-0"
                  style={{ background: 'linear-gradient(135deg, rgba(0,106,220,0.3), rgba(63,64,205,0.3))' }}
                />
              ))}
            </div>
            <p className="m-0 text-sm text-on-surface/68">
              Other scholars are currently studying this course with you.
            </p>
          </div>
        </main>

        <aside className="flex w-full shrink-0 flex-col border-t border-on-surface/10 bg-white/88 lg:w-[320px] lg:border-l lg:border-t-0 lg:overflow-y-auto">
          <div className="shrink-0 border-b border-on-surface/8 px-5 py-5">
            <h2 className="m-0 mb-3 font-headline text-base font-bold text-on-surface">Course Curriculum</h2>
            <div className="grid gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-surface/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[0.74rem] font-medium text-on-surface/64">
                {progressPct}% Complete &mdash; {completedCount}/{totalCount} Lessons
              </span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col py-2" aria-label="Course lessons">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              const isDone = idx < activeLessonIndex;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={[
                    'flex w-full items-start gap-3 border-l-4 px-4 py-3 text-left transition',
                    isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-primary/[0.04]',
                  ].join(' ')}
                  onClick={() => setActiveLesson(lesson)}
                >
                  <span className={`mt-0.5 shrink-0 text-sm leading-5 ${isDone ? 'text-emerald-700' : isActive ? 'text-primary' : 'text-on-surface/40'}`}>
                    {isDone ? <span className="font-bold">✓</span> : isActive ? <span>▶</span> : <span>○</span>}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm font-medium leading-snug text-on-surface">{lesson.title}</span>
                    {lesson.duration_seconds ? (
                      <span className="text-[0.74rem] text-on-surface/64">
                        {formatDuration(lesson.duration_seconds)}
                      </span>
                    ) : null}
                  </span>
                  {isActive && (
                    <span className="shrink-0 self-start whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 text-[0.68rem] font-semibold text-primary">
                      Now Playing
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-on-surface/8 p-4">
            <button
              type="button"
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.99]"
            >
              Chat with Mentor
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
