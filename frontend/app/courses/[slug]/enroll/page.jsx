'use client';

import { use, useEffect, useState } from 'react';
import { readAuthToken } from '../../../_components/auth-session';
import PaymentCheckout from '../../../_components/payment-checkout';

export default function EnrollPage({ params }) {
  const { slug } = use(params);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!readAuthToken()) {
      window.location.replace('/login');
      return;
    }

    fetch(`/api/courses/${slug}`, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }

        return response.json();
      })
      .then((payload) => {
        if (payload) {
          setCourse(payload.data ?? payload);
        }
      })
      .catch(() => {
        setFetchError('Unable to load the course right now.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return (
    <PaymentCheckout
      item={course}
      itemType="course"
      loading={loading}
      notFound={notFound}
      fetchError={fetchError}
      title="Choose how you want to pay"
      description="Use manual bank transfer if you want admin-reviewed approval, or switch to PromptPay for the new PaySolution flow with automatic approval after webhook confirmation."
      backHref={`/courses/${slug}`}
      backLabel="Back to course"
      submitPath={() => '/api/enrollments'}
      submitPayload={(currentCourse) => ({ course_id: String(currentCourse.id) })}
      statusPath={(enrollmentId) => `/api/enrollments/${enrollmentId}/payment-status`}
      regeneratePath={(enrollmentId) => `/api/enrollments/${enrollmentId}/promptpay/regenerate`}
      cancelPath={(enrollmentId) => `/api/enrollments/${enrollmentId}/promptpay/cancel`}
      summaryLabel="Course summary"
      summaryMeta={[
        { label: 'Access', value: 'Lifetime' },
        { label: 'Delivery', value: 'Online course' },
      ]}
    />
  );
}
