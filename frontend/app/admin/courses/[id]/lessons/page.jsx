'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { apiFetch } from '../../../../_components/api';
import AdminShell from '../../../admin-shell';

const EMPTY_FORM = {
  title: '',
  bunny_video_id: '',
  sort_order: '',
  duration_seconds: '',
  is_preview: false,
};

const fieldLabelClass = 'text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-on-surface/58';
const inputClass = 'min-h-11 rounded-2xl border border-on-surface/15 bg-white px-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export default function AdminLessonsPage({ params }) {
  const { id } = use(params);
  const [lessons, setLessons] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function loadLessons() {
    setLoading(true);
    apiFetch(`/api/admin/courses/${id}/lessons`)
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => {
        const data = payload.data ?? payload;
        setLessons([...data].sort((a, b) => a.sort_order - b.sort_order));
      })
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    apiFetch('/api/admin/courses')
      .then((res) => res.json())
      .then((payload) => {
        const courses = payload.data ?? payload;
        const course = courses.find((c) => String(c.id) === String(id));
        if (course) setCourseName(course.title);
      })
      .catch(() => {});

    loadLessons();
  }, [id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowCreate(true);
  }

  function openEdit(lesson) {
    setShowCreate(false);
    setEditId(lesson.id);
    setForm({
      title: lesson.title ?? '',
      bunny_video_id: lesson.bunny_video_id ?? '',
      sort_order: lesson.sort_order ?? '',
      duration_seconds: lesson.duration_seconds ?? '',
      is_preview: lesson.is_preview ?? false,
    });
    setError('');
  }

  function closeForm() {
    setShowCreate(false);
    setEditId(null);
    setError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      title: form.title,
      bunny_video_id: form.bunny_video_id,
      sort_order: Number(form.sort_order),
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      is_preview: form.is_preview,
    };

    try {
      const res = editId
        ? await apiFetch(`/api/admin/lessons/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await apiFetch(`/api/admin/courses/${id}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const payload = await res.json();
        const firstError = payload.errors
          ? Object.values(payload.errors).flat()[0]
          : payload.message;
        setError(firstError ?? 'Save failed.');
        return;
      }

      closeForm();
      loadLessons();
    } catch {
      setError('Cannot reach the service. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lessonId) {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      const res = await apiFetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Delete failed. Please try again.');
        return;
      }
      loadLessons();
    } catch {
      setError('Delete failed. Please try again.');
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function LessonForm({ submitLabel }) {
    return (
      <form className="grid gap-4" onSubmit={handleSave}>
        <label className="grid gap-2">
          <span className={fieldLabelClass}>Title</span>
          <input className={inputClass} name="title" required value={form.title} onChange={handleChange} placeholder="Lesson title" />
        </label>
        <label className="grid gap-2">
          <span className={fieldLabelClass}>Bunny Video ID</span>
          <input className={inputClass} name="bunny_video_id" required value={form.bunny_video_id} onChange={handleChange} placeholder="e.g. abc123-def456" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={fieldLabelClass}>Sort Order</span>
            <input className={inputClass} name="sort_order" type="number" min="0" required value={form.sort_order} onChange={handleChange} placeholder="1" />
          </label>
          <label className="grid gap-2">
            <span className={fieldLabelClass}>Duration (seconds)</span>
            <input className={inputClass} name="duration_seconds" type="number" min="0" value={form.duration_seconds} onChange={handleChange} placeholder="Optional" />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm text-on-surface">
          <input type="checkbox" name="is_preview" checked={form.is_preview} onChange={handleChange} />
          <span>Free preview - visible without enrollment</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0052ae, #006adc)', boxShadow: '0 18px 30px rgba(0,106,220,0.18)' }}
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : submitLabel}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-on-surface/[0.06] px-5 text-sm font-medium text-on-surface transition hover:bg-on-surface/[0.1]"
            type="button"
            onClick={closeForm}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="m-0 mb-2 flex items-center gap-2 text-[0.82rem] text-on-surface/50">
            <Link href="/admin/courses" className="font-medium text-primary no-underline transition-colors hover:text-primary/80 hover:underline">Courses</Link>
            <span className="text-on-surface/30">/</span>
            <span>{courseName || `Course #${id}`}</span>
          </p>
          <h1 className="m-0 mb-1 font-headline text-[clamp(1.6rem,2.2vw,2.4rem)] font-extrabold leading-tight text-on-surface">Lesson Management</h1>
          <p className="m-0 text-sm text-on-surface/50">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in this course
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #0052ae, #006adc)', boxShadow: '0 18px 30px rgba(0,106,220,0.18)' }}
          type="button"
          onClick={openCreate}
        >
          + Add Lesson
        </button>
      </div>

      {showCreate && (
        <div className="rounded-3xl border border-on-surface/8 bg-white/95 p-6 shadow-[0_12px_36px_rgba(25,28,34,0.08)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="m-0 font-headline text-lg font-bold text-on-surface">Add New Lesson</h3>
            <button className="grid h-8 w-8 place-items-center rounded-xl bg-on-surface/[0.06] text-on-surface/60 transition hover:bg-on-surface/[0.1]" type="button" onClick={closeForm} aria-label="Close">X</button>
          </div>
          {error ? <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <LessonForm submitLabel="Add lesson" />
        </div>
      )}

      {loading ? (
        <p className="m-0 py-10 text-sm text-on-surface/55">Loading lessons...</p>
      ) : lessons.length === 0 && !showCreate ? (
        <div className="py-16 text-center">
          <p className="m-0 mb-2 font-headline text-lg font-bold text-on-surface">No lessons yet</p>
          <p className="m-0 text-sm text-on-surface/52">Add the first lesson to this course.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson, index) => (
            <div key={lesson.id}>
              {editId === lesson.id ? (
                <div className="rounded-3xl border border-on-surface/8 bg-white/95 p-6 shadow-[0_12px_36px_rgba(25,28,34,0.08)]">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h3 className="m-0 font-headline text-lg font-bold text-on-surface">Edit Lesson</h3>
                    <button className="grid h-8 w-8 place-items-center rounded-xl bg-on-surface/[0.06] text-on-surface/60 transition hover:bg-on-surface/[0.1]" type="button" onClick={closeForm} aria-label="Close">X</button>
                  </div>
                  {error ? <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
                  <LessonForm submitLabel="Save changes" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-3xl border border-on-surface/8 bg-white/92 px-5 py-5 shadow-[0_4px_18px_rgba(25,28,34,0.05)] transition hover:translate-x-0.5 hover:shadow-[0_8px_24px_rgba(25,28,34,0.08)] md:flex-row md:items-center">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2.5">
                      <p className="m-0 text-[0.95rem] font-semibold text-on-surface">{lesson.title}</p>
                      {lesson.is_preview && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-emerald-700">Free Preview</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="break-all font-mono text-[0.76rem] text-on-surface/40">{lesson.bunny_video_id}</span>
                      {lesson.duration_seconds ? (
                        <span className="whitespace-nowrap text-[0.78rem] text-on-surface/55">
                          ▶ {formatDuration(lesson.duration_seconds)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button className="rounded-xl bg-on-surface/[0.06] px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-on-surface/[0.1]" type="button" onClick={() => openEdit(lesson)}>Edit</button>
                    <button className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100" type="button" onClick={() => handleDelete(lesson.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
        <p className="m-0 mb-1 text-sm font-bold text-primary">Bunny.net Video IDs</p>
        <p className="m-0 text-sm leading-relaxed text-primary/80">
          Enter the Bunny.net video library ID for each lesson. The raw ID is stored securely and never exposed in student-facing API responses.
        </p>
      </div>
    </AdminShell>
  );
}
