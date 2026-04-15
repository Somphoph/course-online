'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '../_components/api';

export default function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch('/api/bundles');
        if (!res.ok) throw new Error('Unable to load bundles.');
        const payload = await res.json();
        if (!cancelled) setBundles(payload.data ?? payload);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Something went wrong.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background px-5 md:px-8 lg:px-12 pb-14">
      {/* Header */}
      <section className="pt-8 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← Home
        </Link>
      </section>

      <section className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Course catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
            Bundles &amp; Packages
          </h1>
          <p className="mt-3 text-lg text-on-surface-variant leading-relaxed max-w-2xl">
            Save more by purchasing multiple courses together. Each bundle is curated to give you a complete learning experience.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid place-items-center py-20">
            <div
              className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"
              role="status"
              aria-label="Loading"
            />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-16 text-center">
            <p className="text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 inline-block">
              {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && bundles.length === 0 && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-30 mb-3">
              package_2
            </span>
            <p className="font-headline font-bold text-lg text-on-surface">No bundles available</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Check back later or browse individual courses.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg,#0052ae,#006adc)' }}
            >
              View all courses
            </Link>
          </div>
        )}

        {/* Bundle Grid */}
        {!loading && bundles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {bundles.map((bundle) => {
              const courseCount = bundle.courses?.length ?? 0;
              return (
                <Link
                  key={bundle.id}
                  href={`/bundles/${bundle.id}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden no-underline text-inherit transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ boxShadow: '0 12px 32px rgba(25,28,34,0.06)' }}
                >
                  {/* Thumbnail */}
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

                  {/* Card body */}
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

                    {/* Price & Savings */}
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

                    {/* Course count */}
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1 border-t border-outline-variant/20">
                      <span className="material-symbols-outlined text-sm">menu_book</span>
                      {courseCount} {courseCount === 1 ? 'course' : 'courses'} included
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
