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

  function LessonForm({ submitLabel }) {
    return (
      <form className={styles.form} onSubmit={handleSave}>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input className={styles.input} name="title" required value={form.title} onChange={handleChange} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Bunny Video ID</span>
          <input className={styles.input} name="bunny_video_id" required value={form.bunny_video_id} onChange={handleChange} placeholder="e.g. abc123-def456" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Sort order</span>
          <input className={styles.input} name="sort_order" type="number" min="0" required value={form.sort_order} onChange={handleChange} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Duration (seconds, optional)</span>
          <input className={styles.input} name="duration_seconds" type="number" min="0" value={form.duration_seconds} onChange={handleChange} />
        </label>
        <label className={styles.checkField}>
          <input type="checkbox" name="is_preview" checked={form.is_preview} onChange={handleChange} />
          <span>Preview lesson (visible without enrollment)</span>
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
      <header className={styles.topbar}>
        <div>
          <p className={styles.topbarLabel}>
            <Link href="/admin/courses" className={styles.breadcrumb}>Courses</Link>
            {' › '}
            {courseName || `Course #${id}`}
          </p>
          <h2 className={styles.topbarTitle}>Lessons</h2>
        </div>
        <button className={styles.createBtn} type="button" onClick={openCreate}>
          + Add lesson
        </button>
      </header>

      {showCreate && (
        <div className={styles.formPanel}>
          <h3 className={styles.formTitle}>Add lesson</h3>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <LessonForm submitLabel="Add lesson" />
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : lessons.length === 0 && !showCreate ? (
        <p className={styles.empty}>No lessons yet. Add the first lesson above.</p>
      ) : (
        <div className={styles.lessonList}>
          {lessons.map((lesson) => (
            <div key={lesson.id}>
              {editId === lesson.id ? (
                <div className={styles.formPanel}>
                  <h3 className={styles.formTitle}>Edit lesson</h3>
                  {error ? <p className={styles.formError}>{error}</p> : null}
                  <LessonForm submitLabel="Save changes" />
                </div>
              ) : (
                <div className={styles.lessonRow}>
                  <div className={styles.lessonOrder}>#{lesson.sort_order}</div>
                  <div className={styles.lessonInfo}>
                    <p className={styles.lessonTitle}>{lesson.title}</p>
                    <p className={styles.lessonMeta}>
                      {lesson.bunny_video_id}
                      {lesson.duration_seconds ? ` · ${lesson.duration_seconds}s` : ''}
                      {lesson.is_preview ? ' · Preview' : ''}
                    </p>
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
    </AdminShell>
  );
}
