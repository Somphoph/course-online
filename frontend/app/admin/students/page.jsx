'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../_components/api';
import AdminShell from '../admin-shell';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiFetch('/api/admin/students')
      .then((res) => {
        if (!res.ok) throw new Error('fetch_failed');
        return res.json();
      })
      .then((payload) => setStudents(payload.data ?? payload))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const totalEnrollments = students.reduce((sum, s) => sum + (s.enrollment_count ?? 0), 0);

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-5 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Community
          </p>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
            Student List
          </h1>
          <p className="text-on-surface-variant mt-1">
            Manage registered students and their enrollments
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Total Students
          </p>
          <p className="font-headline font-extrabold text-4xl text-on-surface">
            {loading ? '—' : students.length.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Total Enrollments
          </p>
          <p className="font-headline font-extrabold text-4xl text-on-surface">
            {loading ? '—' : totalEnrollments.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Avg. Enrollments
          </p>
          <p className="font-headline font-extrabold text-4xl text-on-surface">
            {loading || students.length === 0
              ? '—'
              : (totalEnrollments / students.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-on-surface-variant text-sm py-10">Loading students...</p>
      ) : students.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-headline font-bold text-lg text-on-surface mb-1">No students yet</p>
          <p className="text-sm text-on-surface-variant">
            Students will appear here once they register.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/30">
            <h2 className="font-headline font-bold text-lg text-on-surface">All Students</h2>
            <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
              {students.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container/30">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    Student
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    Registered
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    Enrollments
                  </th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <React.Fragment key={student.id}>
                    <tr
                      className={`cursor-pointer transition-colors border-t border-outline-variant/20 ${
                        expandedId === student.id
                          ? 'bg-primary/5'
                          : 'hover:bg-surface-container/30'
                      }`}
                      onClick={() => toggleExpand(student.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(student.name ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{student.name}</p>
                            <p className="text-xs text-on-surface-variant">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {student.phone ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                        {new Date(student.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            student.enrollment_count > 0
                              ? 'bg-primary/10 text-primary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {student.enrollment_count} enrolment
                          {student.enrollment_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-on-surface-variant">
                          {expandedId === student.id ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                    {expandedId === student.id && (
                      <tr className="bg-primary/3 border-t border-primary/10">
                        <td colSpan={5} className="px-10 py-4 pl-20">
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                            Student ID: #{student.id}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {student.enrollment_count === 0
                              ? 'This student has no active enrollments.'
                              : `${student.enrollment_count} course enrolment${student.enrollment_count !== 1 ? 's' : ''} on record.`}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container/20">
            <p className="text-sm text-on-surface-variant">
              Showing {students.length} of {students.length} students
            </p>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
