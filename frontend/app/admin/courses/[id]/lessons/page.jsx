'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { apiFetch } from '../../../../_components/api';
import AdminShell from '../../../admin-shell';
import styles from './page.module.css';

const EMPTY_FORM = {
  title: '',
  bunny_video_id: '',
  sort_order: '',
  duration_seconds: '',
  is_preview: false,
};

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
    // Fetch course name for breadcrumb
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
      <form className={styles.form} onSubmit={handleSave}>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input className={styles.input} name="title" required value={form.title} onChange={handleChange} placeholder="Lesson title" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Bunny Video ID</span>
          <input className={styles.input} name="bunny_video_id" required value={form.bunny_video_id} onChange={handleChange} placeholder="e.g. abc123-def456" />
        </label>
        <div className={styles.formRow}>
          <label className={styles.field}>
            <span className={styles.label}>Sort Order</span>
            <input className={styles.input} name="sort_order" type="number" min="0" required value={form.sort_order} onChange={handleChange} placeholder="1" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Duration (seconds)</span>
            <input className={styles.input} name="duration_seconds" type="number" min="0" value={form.duration_seconds} onChange={handleChange} placeholder="Optional" />
          </label>
        </div>
        <label className={styles.checkField}>
          <input type="checkbox" name="is_preview" checked={form.is_preview} onChange={handleChange} />
          <span>Free preview — visible without enrollment</span>
        </label>
        <div className={styles.formActions}>
          <button className={styles.saveBtn} type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
          <button className={styles.cancelBtn} type="button" onClick={closeForm}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <AdminShell>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumbRow}>
            <Link href="/admin/courses" className={styles.breadcrumbLink}>Courses</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>{courseName || `Course #${id}`}</span>
          </p>
          <h1 className={styles.pageTitle}>Lesson Management</h1>
          <p className={styles.pageDesc}>
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in this course
          </p>
        </div>
        <button className={styles.createBtn} type="button" onClick={openCreate}>
          + Add Lesson
        </button>
      </div>

      {showCreate && (
        <div className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <h3 className={styles.formTitle}>Add New Lesson</h3>
            <button className={styles.closeBtn} type="button" onClick={closeForm} aria-label="Close">✕</button>
          </div>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <LessonForm submitLabel="Add lesson" />
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading lessons...</p>
      ) : lessons.length === 0 && !showCreate ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No lessons yet</p>
          <p className={styles.emptyDesc}>Add the first lesson to this course.</p>
        </div>
      ) : (
        <div className={styles.lessonList}>
          {lessons.map((lesson, index) => (
            <div key={lesson.id}>
              {editId === lesson.id ? (
                <div className={styles.formPanel}>
                  <div className={styles.formPanelHeader}>
                    <h3 className={styles.formTitle}>Edit Lesson</h3>
                    <button className={styles.closeBtn} type="button" onClick={closeForm} aria-label="Close">✕</button>
                  </div>
                  {error ? <p className={styles.formError}>{error}</p> : null}
                  <LessonForm submitLabel="Save changes" />
                </div>
              ) : (
                <div className={styles.lessonRow}>
                  <div className={styles.lessonIndex}>{index + 1}</div>
                  <div className={styles.lessonInfo}>
                    <div className={styles.lessonTitleRow}>
                      <p className={styles.lessonTitle}>{lesson.title}</p>
                      {lesson.is_preview && (
                        <span className={styles.previewBadge}>Free Preview</span>
                      )}
                    </div>
                    <div className={styles.lessonDetails}>
                      <span className={styles.lessonVideoId}>{lesson.bunny_video_id}</span>
                      {lesson.duration_seconds ? (
                        <span className={styles.lessonDuration}>
                          ▶ {formatDuration(lesson.duration_seconds)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.lessonActions}>
                    <button className={styles.editBtn} type="button" onClick={() => openEdit(lesson)}>Edit</button>
                    <button className={styles.deleteBtn} type="button" onClick={() => handleDelete(lesson.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.proTip}>
        <p className={styles.proTipTitle}>Bunny.net Video IDs</p>
        <p className={styles.proTipText}>
          Enter the Bunny.net video library ID for each lesson. The raw ID is stored securely and never exposed in student-facing API responses.
        </p>
      </div>
    </AdminShell>
  );
}
