'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../_components/api';
import AdminShell from '../admin-shell';
import styles from './page.module.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  thumbnail: '',
  price: '',
  slug: '',
  is_published: false,
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function loadCourses() {
    setLoading(true);
    apiFetch('/api/admin/courses')
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => setCourses(payload.data ?? payload))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCourses();
  }, []);

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

  function openEdit(course) {
    setShowCreate(false);
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
      description: form.description,
      thumbnail: form.thumbnail || null,
      price: Number(form.price),
      slug: form.slug,
      is_published: form.is_published,
    };

    try {
      const res = editId
        ? await apiFetch(`/api/admin/courses/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await apiFetch('/api/admin/courses', {
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
      loadCourses();
    } catch {
      setError('Cannot reach the service. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Delete failed. Please try again.');
        return;
      }
      loadCourses();
    } catch {
      setError('Delete failed. Please try again.');
    }
  }

  function CourseForm({ submitLabel }) {
    return (
      <form className={styles.form} onSubmit={handleSave}>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input className={styles.input} name="title" required value={form.title} onChange={handleChange} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Slug</span>
          <input className={styles.input} name="slug" required value={form.slug} onChange={handleChange} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Price (THB)</span>
          <input className={styles.input} name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea className={styles.textarea} name="description" required value={form.description} onChange={handleChange} rows={3} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Thumbnail URL (optional)</span>
          <input className={styles.input} name="thumbnail" value={form.thumbnail} onChange={handleChange} />
        </label>
        <label className={styles.checkField}>
          <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
          <span>Published</span>
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
          <p className={styles.topbarLabel}>Courses</p>
          <h2 className={styles.topbarTitle}>All courses</h2>
        </div>
        <button className={styles.createBtn} type="button" onClick={openCreate}>
          + New course
        </button>
      </header>

      {showCreate && (
        <div className={styles.formPanel}>
          <h3 className={styles.formTitle}>Create course</h3>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <CourseForm submitLabel="Create course" />
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : courses.length === 0 ? (
        <p className={styles.empty}>No courses yet.</p>
      ) : (
        <div className={styles.courseList}>
          {courses.map((course) => (
            <div key={course.id}>
              {editId === course.id ? (
                <div className={styles.formPanel}>
                  <h3 className={styles.formTitle}>Edit course</h3>
                  {error ? <p className={styles.formError}>{error}</p> : null}
                  <CourseForm submitLabel="Save changes" />
                </div>
              ) : (
                <div className={styles.courseRow}>
                  <div className={styles.courseInfo}>
                    <p className={styles.courseTitle}>{course.title}</p>
                    <p className={styles.courseMeta}>
                      {course.slug} · {Number(course.price).toLocaleString('th-TH')} THB ·{' '}
                      <span className={course.is_published ? styles.published : styles.draft}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                    </p>
                  </div>
                  <div className={styles.courseActions}>
                    <Link href={`/admin/courses/${course.id}/lessons`} className={styles.lessonsLink}>
                      Lessons
                    </Link>
                    <button className={styles.editBtn} type="button" onClick={() => openEdit(course)}>Edit</button>
                    <button className={styles.deleteBtn} type="button" onClick={() => handleDelete(course.id)}>Delete</button>
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
