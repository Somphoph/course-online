'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const featuredCourse = courses[0];
  const supportingCourses = courses.slice(1);

  useEffect(() => {
    Promise.all([
      fetch('/api/courses', { headers: { Accept: 'application/json' } }),
      fetch('/api/bundles', { headers: { Accept: 'application/json' } }),
    ])
      .then(async ([coursesRes, bundlesRes]) => {
        const coursesPayload = coursesRes.ok ? await coursesRes.json() : [];
        const bundlesPayload = bundlesRes.ok ? await bundlesRes.json() : [];
        const courseData = coursesPayload.data ?? coursesPayload;
        const bundleData = bundlesPayload.data ?? bundlesPayload;
        setCourses(Array.isArray(courseData) ? courseData : []);
        setBundles(Array.isArray(bundleData) ? bundleData : []);
      })
      .catch(() => {
        setCourses([]);
        setBundles([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="min-h-screen px-5 md:px-8 lg:px-12 pb-14"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(0,106,220,0.08), transparent 28%), radial-gradient(circle at 82% 16%, rgba(16,185,129,0.08), transparent 24%), linear-gradient(180deg,#f9f9ff 0%,#f8f8ff 100%)',
      }}
    >
      {/* Hero Section */}
      <section className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-stretch min-h-[min(78vh,820px)] pt-4">
        {/* Left — headline + CTA */}
        <header className="flex flex-col justify-center max-w-2xl py-6 lg:py-11">
          {/* Brand pill */}
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="w-4 h-4 rounded-full shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#0052ae,#006adc)', boxShadow: '0 12px 24px rgba(0,106,220,0.18)' }}
              aria-hidden="true"
            />
            <p className="m-0 text-xs tracking-widest uppercase text-on-surface/55 font-body">
              Course Online
            </p>
          </div>

          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold text-on-surface leading-[0.97] tracking-tighter mb-4">
            Learn at your own pace
          </h1>

          <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed max-w-[42ch] mb-6">
            Courses covering Microsoft Excel, MS Access, Power Automate, and App
            Sheet. Browse below and enrol when you&apos;re ready.
          </p>

          <div className="flex flex-wrap gap-4 mt-2">
            <a
              href="#courses"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg no-underline shadow-xl hover:shadow-2xl transition-all"
              style={{ background: 'linear-gradient(135deg,#0052ae,#006adc)' }}
            >
              View all courses
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg no-underline transition-all bg-surface-container-highest text-on-primary-fixed-variant hover:bg-surface-container-high"
            >
              Get started free
            </Link>
          </div>
        </header>

        {/* Right — featured course card */}
        <aside className="relative grid content-center gap-3.5 py-2 overflow-hidden" aria-label="Featured course preview">
          {loading ? (
            <div className="relative z-10 grid place-items-center gap-3.5 min-h-[560px] rounded-[28px] text-on-surface/55"
              style={{ background: 'rgba(255,255,255,0.62)', boxShadow: '0 20px 40px rgba(25,28,34,0.05)' }}>
              <div
                className="w-8 h-8 rounded-full border-[3px] animate-spin"
                style={{ borderColor: 'rgba(0,106,220,0.18)', borderTopColor: '#006adc' }}
                aria-hidden="true"
              />
              <p className="m-0">Loading courses...</p>
            </div>
          ) : featuredCourse ? (
            <Link
              href={`/courses/${featuredCourse.slug}`}
              className="relative z-10 grid overflow-hidden no-underline text-inherit transition-all hover:-translate-y-0.5"
              style={{
                gridTemplateRows: 'minmax(240px,1fr) auto',
                minHeight: '560px',
                borderRadius: '28px',
                background: 'rgba(255,255,255,0.84)',
                boxShadow: '0 20px 40px rgba(25,28,34,0.08)',
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative"
                style={{ background: 'linear-gradient(180deg,rgba(0,106,220,0.08),rgba(16,185,129,0.06)),#eef3ff' }}
              >
                {featuredCourse.thumbnail ? (
                  <img
                    className="w-full h-full object-cover block"
                    src={featuredCourse.thumbnail}
                    alt={featuredCourse.title}
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: 'rgba(0,106,220,0.06)' }} role="presentation" />
                )}
              </div>

              {/* Body */}
              <div className="grid gap-2.5 px-5 py-5">
                <p className="m-0 text-[0.72rem] tracking-widest uppercase text-on-surface/44">
                  Featured course
                </p>
                <h2 className="m-0 font-headline text-[1.7rem] font-bold leading-tight tracking-tight text-on-surface">
                  {featuredCourse.title}
                </h2>
                <p className="m-0 max-w-[34ch] text-on-surface/68 leading-relaxed">
                  {featuredCourse.description}
                </p>
                <div className="flex items-center justify-between gap-3 mt-2.5">
                  <span className="font-bold text-primary-container">
                    {Number(featuredCourse.price).toLocaleString('th-TH')} THB
                  </span>
                  <span className="font-semibold text-on-surface/78">Open course</span>
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="relative z-10 grid place-items-center min-h-[560px] rounded-[28px] text-on-surface/55"
              style={{ background: 'rgba(255,255,255,0.62)', boxShadow: '0 20px 40px rgba(25,28,34,0.05)' }}
            >
              <p className="m-0">No courses available yet. Check back soon.</p>
            </div>
          )}

          {/* Note cards */}
          <div className="relative z-10 grid grid-cols-2 gap-3">
            <article
              className="px-4 py-4 rounded-[18px]"
              style={{ background: 'rgba(255,255,255,0.58)', boxShadow: '0 20px 40px rgba(25,28,34,0.05)' }}
            >
              <p className="m-0 text-[0.74rem] tracking-widest uppercase text-on-surface/46">Format</p>
              <p className="mt-2 mb-0 text-on-surface/72 leading-snug">
                Self-paced lessons with practical assignments.
              </p>
            </article>
            <article
              className="px-4 py-4 rounded-[18px]"
              style={{ background: 'rgba(255,255,255,0.58)', boxShadow: '0 20px 40px rgba(25,28,34,0.05)' }}
            >
              <p className="m-0 text-[0.74rem] tracking-widest uppercase text-on-surface/46">Support</p>
              <p className="mt-2 mb-0 text-on-surface/72 leading-snug">
                Straightforward checkout and dashboard handoff.
              </p>
            </article>
          </div>
        </aside>
      </section>

      {/* Course Catalog Section */}
      <section id="courses" className="mt-7 grid gap-5">
        {/* Catalog header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="m-0 mb-1 text-[0.75rem] tracking-widest uppercase text-on-surface/46">
              Course catalog
            </p>
            <h2 className="m-0 font-headline text-2xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-on-surface">
              Browse by topic
            </h2>
          </div>
          <p className="m-0 max-w-[42ch] text-on-surface/58 leading-relaxed">
            The page keeps one featured course up top, then surfaces the remaining
            courses below.
          </p>
        </div>

        {/* Cards grid */}
        {!loading && supportingCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {supportingCourses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden no-underline text-inherit transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                style={{ boxShadow: '0 12px 32px rgba(25,28,34,0.06)' }}
              >
                {/* Card thumbnail */}
                {course.thumbnail ? (
                  <img
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                    src={course.thumbnail}
                    alt={course.title}
                  />
                ) : (
                  <div
                    className="w-full aspect-video"
                    style={{
                      background:
                        'linear-gradient(180deg,rgba(0,106,220,0.1),rgba(16,185,129,0.06)),rgba(255,255,255,0.6)',
                    }}
                    role="presentation"
                  />
                )}

                {/* Card body */}
                <div className="flex flex-col flex-1 gap-2 p-5">
                  <p className="m-0 font-headline font-bold text-[1.05rem] text-on-surface group-hover:text-primary transition-colors leading-tight">
                    {course.title}
                  </p>
                  <p className="m-0 text-[0.92rem] leading-snug text-on-surface/68 flex-1 line-clamp-3">
                    {course.description}
                  </p>
                  <p className="mt-1 mb-0 font-bold text-primary-container">
                    {Number(course.price).toLocaleString('th-TH')} THB
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* Bundle Section */}
      {!loading && bundles.length > 0 && (
        <section id="bundles" className="mt-12 grid gap-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="m-0 mb-1 text-[0.75rem] tracking-widest uppercase text-on-surface/46">
                Special offers
              </p>
              <h2 className="m-0 font-headline text-2xl lg:text-[2.2rem] font-bold leading-tight tracking-tight text-on-surface">
                Course bundles
              </h2>
            </div>
            <Link
              href="/bundles"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              View all bundles →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bundles.slice(0, 3).map((bundle) => {
              const courseCount = bundle.courses?.length ?? 0;
              return (
                <Link
                  key={bundle.id}
                  href={`/bundles/${bundle.id}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden no-underline text-inherit transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ boxShadow: '0 12px 32px rgba(25,28,34,0.06)' }}
                >
                  {bundle.thumbnail ? (
                    <img
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                      src={bundle.thumbnail}
                      alt={bundle.title}
                    />
                  ) : (
                    <div
                      className="w-full aspect-video"
                      style={{
                        background:
                          'linear-gradient(180deg,rgba(0,106,220,0.1),rgba(16,185,129,0.06)),rgba(255,255,255,0.6)',
                      }}
                      role="presentation"
                    />
                  )}

                  <div className="flex flex-col flex-1 gap-2 p-5">
                    <p className="m-0 text-[0.72rem] tracking-widest uppercase text-on-surface/44">
                      Bundle
                    </p>
                    <p className="m-0 font-headline font-bold text-[1.05rem] text-on-surface group-hover:text-primary transition-colors leading-tight line-clamp-2">
                      {bundle.title}
                    </p>
                    {bundle.description && (
                      <p className="m-0 text-[0.92rem] leading-snug text-on-surface/68 flex-1 line-clamp-3">
                        {bundle.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <span className="font-bold text-primary-container">
                        {Number(bundle.price).toLocaleString('th-TH')} THB
                      </span>
                      {bundle.savings > 0 && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Save {Number(bundle.savings).toLocaleString('th-TH')} THB
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1 border-t border-outline-variant/20">
                      <span className="material-symbols-outlined text-sm">menu_book</span>
                      {courseCount} {courseCount === 1 ? 'course' : 'courses'} included
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
