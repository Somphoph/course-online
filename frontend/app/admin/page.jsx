'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../_components/api';
import AdminShell from './admin-shell';

export default function AdminPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  function loadEnrollments() {
    setLoading(true);
    apiFetch('/api/admin/enrollments?status=pending')
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => {
        setEnrollments(payload.data ?? payload);
      })
      .catch(() => {
        setEnrollments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadEnrollments();
  }, []);

  function handleApprove(id) {
    setActionError('');
    setActionLoading(id);
    apiFetch(`/api/admin/enrollments/${id}/approve`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('action_failed');
        loadEnrollments();
      })
      .catch(() => {
        setActionError('Action failed. Please try again.');
      })
      .finally(() => {
        setActionLoading(null);
      });
  }

  function handleReject(id) {
    setActionError('');
    setActionLoading(id);
    apiFetch(`/api/admin/enrollments/${id}/reject`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('action_failed');
        loadEnrollments();
      })
      .catch(() => {
        setActionError('Action failed. Please try again.');
      })
      .finally(() => {
        setActionLoading(null);
      });
  }

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-5 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Enrollments
          </p>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
            Enrollment Management
          </h1>
          <p className="text-on-surface-variant mt-1 font-medium">
            Review and process student payment verifications
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Total Pending
            </p>
            <p className="text-3xl font-bold text-on-surface">
              {loading ? '—' : enrollments.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Awaiting Review
            </p>
            <p className="text-3xl font-bold text-on-surface">
              {loading ? '—' : enrollments.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Action Required
            </p>
            <p className="text-3xl font-bold text-on-surface">
              {loading ? '—' : enrollments.length > 0 ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined text-2xl">cancel</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {actionError && (
        <p className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {actionError}
        </p>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/30">
          <h2 className="font-headline font-bold text-lg text-on-surface">Pending Approvals</h2>
          {enrollments.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">
              {enrollments.length} pending
            </span>
          )}
        </div>

        {loading ? (
          <p className="px-6 py-12 text-on-surface-variant text-sm">Loading enrollments...</p>
        ) : enrollments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-on-surface font-semibold mb-1">No pending enrollments</p>
            <p className="text-sm text-on-surface-variant">
              All enrollment requests have been processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Student
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Course
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                    Slip
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                          {(enrollment.user?.name ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {enrollment.user?.name ?? '—'}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {enrollment.user?.email ?? ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-on-surface">
                        {enrollment.course?.title ?? '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                      {new Date(enrollment.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface whitespace-nowrap">
                      {enrollment.course?.price
                        ? `${Number(enrollment.course.price).toLocaleString('th-TH')} THB`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-primary/8 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                        onClick={() => {
                          apiFetch(`/api/admin/enrollments/${enrollment.id}/slip`)
                            .then((res) => {
                              if (!res.ok) throw new Error('slip_failed');
                              return res.blob();
                            })
                            .then((blob) => {
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank', 'noopener,noreferrer');
                            })
                            .catch(() => {
                              setActionError('Unable to load slip image.');
                            });
                        }}
                      >
                        View ↗
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleApprove(enrollment.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          {actionLoading === enrollment.id ? '...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleReject(enrollment.id)}
                          className="flex items-center gap-1.5 px-4 py-2 border border-red-500 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          {actionLoading === enrollment.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
