'use client';

import { use, useEffect, useState } from 'react';
import { readAuthToken } from '../../../_components/auth-session';
import PaymentCheckout from '../../../_components/payment-checkout';

export default function BundlePurchasePage({ params }) {
  const { id } = use(params);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!readAuthToken()) {
      window.location.replace('/login');
      return;
    }

    fetch(`/api/bundles/${id}`, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }

        return response.json();
      })
      .then((payload) => {
        if (payload) {
          setBundle(payload.data ?? payload);
        }
      })
      .catch(() => {
        setFetchError('Unable to load the bundle right now.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return (
    <PaymentCheckout
      item={bundle}
      itemType="bundle"
      loading={loading}
      notFound={notFound}
      fetchError={fetchError}
      title="Purchase the full bundle"
      description="Choose between manual slip upload and the new PromptPay checkout. Bundle approval unlocks every included course in one transaction."
      backHref={`/bundles/${id}`}
      backLabel="Back to bundle"
      submitPath={(currentBundle) => `/api/bundles/${currentBundle.id}/purchase`}
      submitPayload={() => ({})}
      statusPath={(bundleEnrollmentId) => `/api/bundle-enrollments/${bundleEnrollmentId}/payment-status`}
      regeneratePath={(bundleEnrollmentId) => `/api/bundle-enrollments/${bundleEnrollmentId}/promptpay/regenerate`}
      cancelPath={(bundleEnrollmentId) => `/api/bundle-enrollments/${bundleEnrollmentId}/promptpay/cancel`}
      summaryLabel="Bundle summary"
      summaryMeta={[
        { label: 'Included courses', value: `${bundle?.courses?.length ?? 0} total` },
        { label: 'Savings', value: `${Number(bundle?.savings ?? 0).toLocaleString('th-TH')} THB` },
      ]}
    />
  );
}
