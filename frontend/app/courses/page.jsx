'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const StarIcon = ({ filled }) => (
  <span
    className="material-symbols-outlined text-xl text-secondary"
    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
  >
    star
  </span>
);

function CourseCard({ course }) {
  const progress = course.progress ?? null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest transition-all duration-300 group hover:shadow-xl">
      <div className="relative h-48 overflow-hidden">
        {progress !== null && (
          <div className="absolute left-0 top-0 z-10 h-0.5 w-full bg-secondary-container">
            <div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
          </div>
        )}
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface-container-high" />
        )}
        {course.badge && (
          <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
            {course.badge}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">
            {course.category ?? 'Course'}
          </span>
          {course.rating && (
            <div className="flex items-center gap-1 text-sm font-bold text-secondary">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {Number(course.rating).toFixed(1)}
            </div>
          )}
        </div>

        <h3 className="mb-2 font-headline text-xl font-extrabold leading-tight text-on-surface transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        <p className="mb-6 line-clamp-2 text-sm text-outline">{course.description}</p>

        <div className="mt-auto flex items-center justify-between border-t border-surface-container pt-4">
          <div className="flex items-center gap-2">
            {course.instructor_avatar ? (
              <div className="h-8 w-8 overflow-hidden rounded-full bg-surface-container-high">
                <img src={course.instructor_avatar} alt={course.instructor} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(course.instructor ?? 'I')[0]}
              </div>
            )}
            <span className="text-xs font-semibold text-on-surface-variant">{course.instructor}</span>
          </div>
          <span className="text-lg font-black text-on-surface">
            {course.price != null ? `$${Number(course.price).toFixed(2)}` : 'Free'}
          </span>
        </div>
      </div>

      <Link href={`/courses/${course.slug}`} className="absolute inset-0" aria-label={course.title} />
    </article>
  );
}

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [level, setLevel] = useState('All Levels');

  useEffect(() => {
    fetch('/api/courses', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((payload) => setCourses(payload.data ?? payload ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses
    .filter((c) => {
      if (search && !c.title?.toLowerCase().includes(search.toLowerCase())) return false;
      if (level !== 'All Levels' && c.level && c.level !== level) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
      if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
      return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
    });

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-5 pb-16 pt-8 md:flex-row md:px-8">
      {/* Sidebar */}
      <aside className="w-full flex-shrink-0 space-y-6 md:w-72">
        <div className="rounded-xl bg-surface-container-low p-6">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
            <span className="material-symbols-outlined">filter_list</span>
            Refine Selection
          </h3>

          {/* Level filter */}
          <div className="mb-8">
            <span className="mb-4 block text-xs font-black uppercase tracking-widest text-outline">
              Experience Level
            </span>
            <div className="grid grid-cols-1 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`rounded-lg px-4 py-2 text-left text-sm transition-colors ${
                    level === l
                      ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Min rating */}
          <div>
            <span className="mb-4 block text-xs font-black uppercase tracking-widest text-outline">
              Min. Rating
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon key={n} filled={n <= 4} />
              ))}
              <span className="ml-2 text-xs font-bold">4.0 & Up</span>
            </div>
          </div>
        </div>

        {/* CTA card */}
        <div className="relative overflow-hidden rounded-xl bg-inverse-surface p-6 text-white">
          <div className="relative z-10">
            <h4 className="mb-2 font-headline text-xl font-bold">Elevate Your Learning</h4>
            <p className="mb-4 text-sm leading-relaxed text-surface-container-highest/70">
              Join 50,000+ scholars on the platform.
            </p>
            <Link
              href="/register"
              className="block w-full rounded-lg bg-secondary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-on-secondary-container no-underline"
            >
              Get Started Free
            </Link>
          </div>
          <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1">
        {/* Search & sort */}
        <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="group relative w-full md:max-w-lg">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-2xl border-none bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search courses..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full items-center gap-3 md:w-auto">
            <span className="whitespace-nowrap text-sm font-medium text-outline">Sort by:</span>
            <select
              className="cursor-pointer border-none bg-transparent font-bold text-on-surface focus:ring-0"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-on-surface-variant">
            <span className="material-symbols-outlined mb-4 block text-5xl opacity-30">search_off</span>
            <p className="font-semibold">No courses found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <div key={course.id ?? course.slug} className="relative">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
