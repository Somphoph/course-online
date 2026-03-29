'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../_components/api';
import AdminShell from '../admin-shell';

const EMPTY_FORM = {
  title: '',
  description: '',
  thumbnail: '',
  price: '',
  slug: '',
  is_published: false,
};

const inputCls =
  'w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-lg p-4 text-sm text-on-surface font-body placeholder:text-outline/60 outline-none';
const labelCls = 'block text-xs font-bold text-on-surface-variant uppercase tracking-tighter ml-1 mb-1';

function CourseForm({ form, onChange, onSave, onCancel, saving, submitLabel }) {
  return (
    <form onSubmit={onSave} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="space-y-1">
          <label className={labelCls}>Title</label>
          <input className={inputCls} name="title" required value={form.title} onChange={onChange} placeholder="Course title" />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Slug</label>
          <input className={inputCls} name="slug" required value={form.slug} onChange={onChange} placeholder="course-slug" />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} resize-none`} name="description" required value={form.description} onChange={onChange} rows={4} placeholder="Course description..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelCls}>Price (THB)</label>
            <input className={inputCls} name="price" type="number" min="0" step="0.01" required value={form.price} onChange={onChange} placeholder="0" />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Status</label>
            <button
              type="button"
              onClick={() => onChange({ target: { name: 'is_published', type: 'checkbox', checked: !form.is_published } })}
              className="h-14 w-full flex items-center justify-between bg-surface-container-low px-4 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-on-surface">{form.is_published ? 'Published' : 'Draft'}</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${form.is_published ? 'bg-primary' : 'bg-outline-variant'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.is_published ? 'right-1' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Thumbnail URL</label>
          <input className={inputCls} name="thumbnail" value={form.thumbnail} onChange={onChange} placeholder="https://..." />
          {!form.thumbnail && (
            <div className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined mb-2 text-4xl text-outline">cloud_upload</span>
              <p className="text-xs text-on-surface-variant">
                Or paste a URL above<br />
                <span className="text-primary font-bold">Recommended 1200×800px</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 bg-surface-container-low p-6 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3.5 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3.5 rounded-lg font-bold text-white shadow-md active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #0052ae 0%, #006adc 100%)' }}
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function loadCourses() {
    setLoading(true);
    apiFetch('/api/admin/courses')
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((payload) => setCourses(payload.data ?? payload))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCourses(); }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((curr) => ({ ...curr, [name]: type === 'checkbox' ? checked : value }));
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setPanelOpen(true);
  }

  function openEdit(course) {
    setEditId(course.id);
    setForm({
      title: course.title ?? '',
      description: course.description ?? '',
      thumbnail: course.thumbnail ?? '',
      price: course.price ?? '',
      slug: course.slug ?? '',
      is_published: course.is_published ?? false,
    });
    setError('');
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditId(null);
    setError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      title: form.title,
      description: form.description,
      thumbnail: form.thumbnail || null,
      price: Number(form.price),
      slug: form.slug,
      is_published: form.is_published,
    };
    try {
      const res = editId
        ? await apiFetch(`/api/admin/courses/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await apiFetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const payload = await res.json();
        const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : payload.message;
        setError(firstError ?? 'Save failed.');
        return;
      }
      closePanel();
      loadCourses();
    } catch {
      setError('Cannot reach the service. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/admin/courses/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { setError('Delete failed.'); return; }
      loadCourses();
    } catch {
      setError('Delete failed.');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tight">Courses</h2>
          <p className="mt-2 text-lg text-on-surface-variant">Curate and manage your academic catalog.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0052ae 0%, #006adc 100%)' }}
        >
          <span className="material-symbols-outlined">add</span>
          New Course
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Course List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <span className="material-symbols-outlined mb-2 text-5xl text-on-surface-variant opacity-30">menu_book</span>
          <p className="font-headline font-bold text-lg text-on-surface">No courses yet</p>
          <p className="text-sm text-on-surface-variant">Get started by creating your first course.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-2 flex items-center gap-2 rounded-lg px-6 py-3 font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0052ae 0%, #006adc 100%)' }}
          >
            <span className="material-symbols-outlined">add</span>
            New Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group flex items-center gap-8 rounded-xl bg-surface-container-lowest p-6 shadow-sm transition-colors duration-300 hover:bg-surface-container-low"
            >
              {/* Thumbnail */}
              <div className="h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary-container/10">
                    <span className="material-symbols-outlined text-4xl text-primary/40">play_circle</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    course.is_published ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                  <h3 className="font-headline font-bold text-xl text-on-surface truncate">{course.title}</h3>
                </div>
                {course.description && (
                  <p className="mt-1 mb-3 text-sm text-on-surface-variant line-clamp-1">{course.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    {course.lessons_count ?? 0} Lessons
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">group</span>
                    {course.enrollments_count ?? 0} Students
                  </div>
                  <span className="font-headline font-bold text-primary">
                    ฿{Number(course.price).toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 flex-col items-end gap-3">
                <Link
                  href={`/admin/courses/${course.id}/lessons`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Manage Lessons →
                </Link>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(course)}
                    className="rounded-full p-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-primary"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(course)}
                    className="rounded-full p-3 text-on-surface-variant transition-all hover:bg-red-50 hover:text-error"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right slide panel */}
      {panelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-on-surface/20 backdrop-blur-sm"
            onClick={closePanel}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 flex h-screen w-[450px] flex-col bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-container p-8">
              <h2 className="font-headline font-bold text-2xl text-on-surface">
                {editId ? 'Edit Course' : 'Course Details'}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {error && (
              <p className="mx-8 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            <CourseForm
              form={form}
              onChange={handleChange}
              onSave={handleSave}
              onCancel={closePanel}
              saving={saving}
              submitLabel={editId ? 'Save Changes' : 'Create Course'}
            />
          </div>
        </>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-on-surface/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-8 shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="mb-2 font-headline font-bold text-2xl text-on-surface">Delete Course?</h3>
            <p className="mb-8 text-on-surface-variant">
              This action cannot be undone. All lesson data and enrollment records for{' '}
              <span className="font-bold text-on-surface">"{deleteTarget.title}"</span> will be permanently removed.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg py-3 font-bold text-on-surface-variant transition-all hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-error py-3 font-bold text-white transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
