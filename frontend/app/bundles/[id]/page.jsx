'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

export default function BundleDetailPage({ params }) {
  const { id } = use(params);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/bundles/${id}`, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }

        return response.json();
      })
      .then((payload) => {
        if (payload) {
          setBundle(payload.data ?? payload);
        }
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div
        className="w-8 h-8 mx-auto mt-20 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (notFound || !bundle) {
    return (
      <div className="min-h-screen px-8 py-10 bg-background">
        <div className="py-12 text-center text-on-surface-variant">
          <p className="mb-4">Bundle not found.</p>
          <Link href="/" className="text-primary font-semibold hover:underline">
            Browse the catalog
          </Link>
        </div>
      </div>
    );
  }

  const courses = bundle.courses ?? [];

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← Home
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Bundle</p>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight leading-tight">
            {bundle.title}
          </h1>
          {bundle.description ? (
            <p className="text-lg text-on-surface-variant leading-relaxed">{bundle.description}</p>
          ) : null}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-outline-variant/30">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Bundle price</p>
              <p className="mt-2 text-2xl font-headline font-bold text-primary-container">
                {Number(bundle.price).toLocaleString('th-TH')} THB
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-outline-variant/30">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Courses</p>
              <p className="mt-2 text-2xl font-headline font-bold">{courses.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-outline-variant/30">
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Savings</p>
              <p className="mt-2 text-2xl font-headline font-bold text-emerald-700">
                {Number(bundle.savings).toLocaleString('th-TH')} THB
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-outline-variant/30 overflow-hidden">
            {bundle.thumbnail ? (
              <img src={bundle.thumbnail} alt={bundle.title} className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video bg-surface-container" />
            )}
            <div className="p-6 space-y-5">
              <p className="text-3xl font-headline font-extrabold">
                {Number(bundle.price).toLocaleString('th-TH')}{' '}
                <span className="text-lg font-semibold text-on-surface-variant">THB</span>
              </p>
              <Link
                href={`/bundles/${bundle.id}/purchase`}
                className="block w-full text-center py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/30"
              >
                Buy this bundle
              </Link>
              <ul className="space-y-3 pt-2 border-t border-slate-100">
                <li className="flex items-start gap-3 text-sm font-medium">
                  <span className="material-symbols-outlined text-primary">done</span>
                  Bundle purchase with one payment
                </li>
                <li className="flex items-start gap-3 text-sm font-medium">
                  <span className="material-symbols-outlined text-primary">done</span>
                  PromptPay instant approval supported
                </li>
                <li className="flex items-start gap-3 text-sm font-medium">
                  <span className="material-symbols-outlined text-primary">done</span>
                  Courses unlock together after approval
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 p-8">
          <h2 className="text-2xl font-headline font-bold mb-6">Included courses</h2>
          <div className="grid gap-4">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-outline-variant/20 px-5 py-4"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Course {index + 1}
                  </p>
                  <h3 className="text-lg font-bold mt-1">{course.title}</h3>
                </div>
                <Link href={`/courses/${course.slug}`} className="text-primary font-semibold hover:underline">
                  View course
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
