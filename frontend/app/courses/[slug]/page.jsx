'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

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
    return (
      <div
        className="w-8 h-8 mx-auto mt-20 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen px-8 py-10 bg-background">
        <div className="py-12 text-center text-on-surface-variant">
          <p className="mb-4">Course not found.</p>
          <Link href="/" className="text-primary font-semibold hover:underline">
            Browse all courses
          </Link>
        </div>
      </div>
    );
  }

  const lessons = course.lessons ?? [];

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* Breadcrumb / back link */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← All courses
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Course info */}
        <div className="lg:col-span-7 space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Course</p>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight leading-tight text-on-surface">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-lg text-on-surface-variant leading-relaxed">{course.description}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Price</p>
                <p className="font-bold text-sm text-primary">
                  {Number(course.price).toLocaleString('th-TH')} THB
                </p>
              </div>
            </div>
            {lessons.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Lessons</p>
                  <p className="font-bold text-sm">
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Thumbnail + price card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-outline-variant/30 overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="w-full aspect-video bg-surface-container" role="presentation" />
            )}
            <div className="p-6 space-y-5">
              <p className="text-3xl font-headline font-extrabold text-on-surface">
                {Number(course.price).toLocaleString('th-TH')}{' '}
                <span className="text-lg font-semibold text-on-surface-variant">THB</span>
              </p>
              <Link
                href={`/courses/${course.slug}/enroll`}
                className="block w-full text-center py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/30 hover:shadow-xl transition-all"
              >
                Enrol now
              </Link>
              <ul className="space-y-3 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-3 text-sm font-medium">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Lifetime access to all lessons
                </li>
                <li className="flex items-start gap-3 text-sm font-medium">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Approval within 1 business day
                </li>
                <li className="flex items-start gap-3 text-sm font-medium">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Stream on any device
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      {lessons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-8">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-3 mb-6">
              <span className="w-8 h-1 bg-primary rounded-full" />
              Course content
              <span className="text-base font-normal text-on-surface-variant">
                ({lessons.length} lesson{lessons.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div className="divide-y divide-slate-100">
              {lessons
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex justify-between items-center py-4 gap-3"
                  >
                    <p className="text-sm font-medium text-on-surface">{lesson.title}</p>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {lesson.duration_seconds ? (
                        <span className="text-xs text-on-surface-variant">
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      ) : null}
                      {lesson.is_preview ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          Preview
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-medium">
                          Enrolled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
