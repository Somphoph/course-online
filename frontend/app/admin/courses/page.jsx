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
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Title</span>
            <input className={styles.input} name="title" required value={form.title} onChange={handleChange} placeholder="Course title" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Slug</span>
            <input className={styles.input} name="slug" required value={form.slug} onChange={handleChange} placeholder="course-slug" />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea className={styles.textarea} name="description" required value={form.description} onChange={handleChange} rows={3} placeholder="Course description..." />
        </label>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Price (THB)</span>
            <input className={styles.input} name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} placeholder="0" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Thumbnail URL (optional)</span>
            <input className={styles.input} name="thumbnail" value={form.thumbnail} onChange={handleChange} placeholder="https://..." />
          </label>
        </div>
        <label className={styles.checkField}>
          <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
          <span>Published — visible to students</span>
        </label>
        <div className={styles.formActions}>
          <button className={styles.saveBtn} type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
          <button className={styles.cancelBtn} type="button" onClick={closeForm}>Cancel</button>
        </div>
      </form>
    );
  }

  const published = courses.filter((c) => c.is_published).length;
  const drafts = courses.length - published;

  return (
    <AdminShell>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.pageKicker}>Content</p>
          <h1 className={styles.pageTitle}>Course Management</h1>
          <p className={styles.pageDesc}>Create, edit, and manage your course catalog</p>
        </div>
        <button className={styles.createBtn} type="button" onClick={openCreate}>
          + New Course
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statChip}>
          <span className={styles.statNum}>{courses.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={`${styles.statChip} ${styles.statChipGreen}`}>
          <span className={styles.statNum}>{published}</span>
          <span className={styles.statLabel}>Published</span>
        </div>
        <div className={`${styles.statChip} ${styles.statChipAmber}`}>
          <span className={styles.statNum}>{drafts}</span>
          <span className={styles.statLabel}>Draft</span>
        </div>
      </div>

      {showCreate && (
        <div className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <h3 className={styles.formTitle}>Create New Course</h3>
            <button className={styles.closeBtn} type="button" onClick={closeForm} aria-label="Close">✕</button>
          </div>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <CourseForm submitLabel="Create course" />
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptyTitle}>No courses yet</p>
          <p className={styles.emptyDesc}>Get started by creating your first course.</p>
          <button className={styles.createBtn} type="button" onClick={openCreate}>+ New Course</button>
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {courses.map((course) => (
            <div key={course.id}>
              {editId === course.id ? (
                <div className={styles.formPanel}>
                  <div className={styles.formPanelHeader}>
                    <h3 className={styles.formTitle}>Edit Course</h3>
                    <button className={styles.closeBtn} type="button" onClick={closeForm} aria-label="Close">✕</button>
                  </div>
                  {error ? <p className={styles.formError}>{error}</p> : null}
                  <CourseForm submitLabel="Save changes" />
                </div>
              ) : (
                <div className={styles.courseCard}>
                  <div className={styles.courseThumbnail}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className={styles.thumbnailImg} />
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        <span className={styles.thumbnailIcon}>▶</span>
                      </div>
                    )}
                    <span className={course.is_published ? styles.publishedBadge : styles.draftBadge}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className={styles.courseBody}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    {course.description && (
                      <p className={styles.courseDesc}>{course.description}</p>
                    )}
                    <div className={styles.courseMeta}>
                      <span className={styles.courseSlug}>{course.slug}</span>
                      <span className={styles.coursePrice}>
                        {Number(course.price).toLocaleString('th-TH')} THB
                      </span>
                    </div>
                  </div>
                  <div className={styles.courseFooter}>
                    <Link href={`/admin/courses/${course.id}/lessons`} className={styles.lessonsLink}>
                      Manage Lessons →
                    </Link>
                    <div className={styles.courseActions}>
                      <button className={styles.editBtn} type="button" onClick={() => openEdit(course)}>Edit</button>
                      <button className={styles.deleteBtn} type="button" onClick={() => handleDelete(course.id)}>Delete</button>
                    </div>
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
