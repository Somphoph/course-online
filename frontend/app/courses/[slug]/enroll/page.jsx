'use client';

import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { readAuthToken } from '../../../_components/auth-session';

const BANK_INFO = {
  bank: 'กสิกรไทย (KBank)',
  accountName: 'บริษัท คอร์ส ออนไลน์ จำกัด',
  accountNumber: 'XXX-X-XXXXX-X',
};

export default function EnrollPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const fileRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    // sync with hidden input via DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileRef.current) fileRef.current.files = dt.files;
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!readAuthToken()) {
      router.replace('/login');
    }
  }, [router]);

  // Fetch course info to show the course title
  useEffect(() => {
    fetch(`/api/courses/${slug}`, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((payload) => setCourse(payload.data ?? payload))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const file = fileRef.current?.files?.[0];

    if (!file) {
      setError('Please select your bank transfer slip image.');
      return;
    }

    if (!course?.id) {
      setError('Course information is missing. Please refresh and try again.');
      return;
    }

    setSubmitting(true);

    try {
      const token = readAuthToken();
      const body = new FormData();
      body.append('course_id', course.id);
      body.append('slip_image', file);

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'Enrolment failed. Please try again.');
        return;
      }

      setSuccess('Enrolment submitted! We will review your slip and notify you shortly.');

      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
    } catch {
      setError('Cannot reach the service right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="w-8 h-8 mx-auto mt-20 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* Top bar / back link */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-2">
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← Back to course
        </Link>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-20 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Payment form */}
          <div className="lg:col-span-7 space-y-10">
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Enrolment
              </p>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-2">
                Upload payment slip
              </h1>
              <p className="text-on-surface-variant leading-relaxed">
                Transfer the course fee to our bank account, then upload a photo or screenshot of
                your transfer slip below. We will approve your enrolment within 1 business day.
              </p>
            </section>

            {/* Bank info */}
            <section className="bg-surface-container-low rounded-2xl p-8 space-y-4 border-l-4 border-primary">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                โอนเงินมาที่
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm text-on-surface-variant flex-shrink-0">ธนาคาร</span>
                  <span className="text-sm font-semibold text-on-surface text-right">
                    {BANK_INFO.bank}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm text-on-surface-variant flex-shrink-0">ชื่อบัญชี</span>
                  <span className="text-sm font-semibold text-on-surface text-right">
                    {BANK_INFO.accountName}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm text-on-surface-variant flex-shrink-0">เลขบัญชี</span>
                  <span className="text-sm font-semibold text-on-surface text-right">
                    {BANK_INFO.accountNumber}
                  </span>
                </div>
              </div>
            </section>

            {/* Alerts */}
            {error ? (
              <p className="px-4 py-3.5 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="px-4 py-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
                {success}
              </p>
            ) : null}

            {/* Upload form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Transfer slip image
                </label>

                {/* Hidden native input */}
                <input
                  ref={fileRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  required
                  disabled={submitting || !!success}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {/* Drop zone */}
                <div
                  onClick={() => !submitting && !success && fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden
                    ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant bg-surface-container-low hover:border-primary/50 hover:bg-primary/3'}
                    ${submitting || success ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  {preview ? (
                    /* Preview state */
                    <div className="relative">
                      <img src={preview} alt="Slip preview" className="w-full max-h-64 object-contain bg-surface-container" />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-4">
                        <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-on-surface backdrop-blur">
                          <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                          {selectedFile.name}
                          <span className="text-outline">· {(selectedFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragOver ? 'bg-primary/15' : 'bg-surface-container'}`}>
                        <span className={`material-symbols-outlined text-3xl transition-colors ${dragOver ? 'text-primary' : 'text-outline'}`}>
                          upload_file
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {dragOver ? 'วางไฟล์ที่นี่' : 'ลากวางหรือ '}
                          {!dragOver && <span className="text-primary underline underline-offset-2">คลิกเพื่อเลือกไฟล์</span>}
                        </p>
                        <p className="mt-1 text-xs text-outline">JPG, PNG หรือ WEBP · ขนาดไม่เกิน 2 MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                type="submit"
                disabled={submitting || !!success}
              >
                {submitting ? 'Submitting...' : 'Submit enrolment'}
              </button>
            </form>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <div className="p-8 space-y-6">
                <h2 className="text-2xl font-headline font-bold tracking-tight">Order Summary</h2>

                {course?.title ? (
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-surface-container flex-shrink-0 overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-on-surface leading-tight">{course.title}</h3>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">
                        Online Course
                      </p>
                      <p className="text-sm font-bold text-primary mt-2">
                        {Number(course.price).toLocaleString('th-TH')} THB
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3 pt-6 border-t border-surface-container">
                  <div className="flex justify-between text-on-surface-variant font-medium text-sm">
                    <span>Subtotal</span>
                    <span>
                      {course ? `${Number(course.price).toLocaleString('th-TH')} THB` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-on-surface text-lg pt-1">
                    <span>Total</span>
                    <span className="text-primary-container">
                      {course ? `${Number(course.price).toLocaleString('th-TH')} THB` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-4 p-6 pt-0">
                <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Secure Payment
                  </span>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    1-Day Approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
