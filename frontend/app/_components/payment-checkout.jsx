'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { apiFetch, buildJsonRequest } from './api';

const BANK_INFO = {
  bank: 'กสิกรไทย (KBank)',
  accountName: 'บริษัท คอร์ส ออนไลน์ จำกัด',
  accountNumber: 'XXX-X-XXXXX-X',
};

function formatCurrency(amount) {
  return `${Number(amount ?? 0).toLocaleString('th-TH')} THB`;
}

function formatCountdown(expiresAt) {
  const remaining = new Date(expiresAt).getTime() - Date.now();

  if (Number.isNaN(remaining) || remaining <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export default function PaymentCheckout({
  item,
  itemType,
  loading,
  notFound,
  fetchError,
  title,
  description,
  backHref,
  backLabel,
  submitPath,
  submitPayload,
  statusPath,
  regeneratePath,
  cancelPath,
  summaryLabel,
  summaryMeta,
}) {
  const fileRef = useRef(null);
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [promptPaySession, setPromptPaySession] = useState(null);
  const [countdown, setCountdown] = useState('00:00');

  useEffect(() => {
    if (!promptPaySession?.expires_at) {
      setCountdown('00:00');
      return undefined;
    }

    const updateCountdown = () => {
      setCountdown(formatCountdown(promptPaySession.expires_at));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [promptPaySession]);

  useEffect(() => {
    if (!promptPaySession?.entity_id || success) {
      return undefined;
    }

    const poll = async () => {
      try {
        const response = await apiFetch(statusPath(promptPaySession.entity_id));

        if (!response.ok) {
          return;
        }

        const payload = await response.json();

        if (payload.status === 'approved') {
          setSuccess('Payment confirmed. Redirecting to your dashboard...');
          window.setTimeout(() => {
            window.location.assign('/dashboard');
          }, 1200);
        } else if (payload.payment_status === 'failed') {
          setError('Payment was not completed. Please use bank transfer or contact support.');
        }
      } catch {
        // Keep polling silently; the page should recover when the API is reachable again.
      }
    };

    poll();
    const interval = window.setInterval(poll, 3000);

    return () => window.clearInterval(interval);
  }, [promptPaySession, statusPath, success]);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (event) => setPreview(event.target?.result ?? null);
    reader.readAsDataURL(file);

    const dt = new DataTransfer();
    dt.items.add(file);

    if (fileRef.current) {
      fileRef.current.files = dt.files;
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const submitManualPayment = async () => {
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setError('Please select your transfer slip image.');
      return;
    }

    const body = new FormData();
    const payload = submitPayload(item);

    Object.entries(payload).forEach(([key, value]) => {
      body.append(key, value);
    });

    body.append('payment_method', 'manual');
    body.append('slip_image', file);

    const response = await apiFetch(submitPath(item), {
      method: 'POST',
      body,
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message ?? 'Unable to submit the slip right now.');
    }

    setSuccess('Payment slip submitted. Redirecting to your dashboard...');
    window.setTimeout(() => {
      window.location.assign('/dashboard');
    }, 1200);
  };

  const submitPromptPayPayment = async () => {
    const response = await apiFetch(
      submitPath(item),
      buildJsonRequest({
        ...submitPayload(item),
        payment_method: 'promptpay',
      })
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message ?? 'Unable to generate a PromptPay QR right now.');
    }

    setPromptPaySession(result);
    setPaymentMethod('promptpay');
  };

  const regeneratePromptPayPayment = async () => {
    if (!promptPaySession?.entity_id) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiFetch(
        regeneratePath(promptPaySession.entity_id),
        buildJsonRequest({})
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Unable to generate a new QR right now.');
      }

      setPromptPaySession(result);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPromptPayPayment = async () => {
    if (!promptPaySession?.entity_id) {
      setPromptPaySession(null);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiFetch(
        cancelPath(promptPaySession.entity_id),
        buildJsonRequest({})
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Unable to cancel PromptPay right now.');
      }

      setPromptPaySession(null);
      setPaymentMethod('manual');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (paymentMethod === 'promptpay') {
        await submitPromptPayPayment();
      } else {
        await submitManualPayment();
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="w-8 h-8 mx-auto mt-20 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-background px-8 py-10">
        <div className="py-16 text-center text-on-surface-variant">
          <p className="mb-4">{itemType === 'bundle' ? 'Bundle' : 'Course'} not found.</p>
          <Link href="/" className="text-primary font-semibold hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const qrExpired = promptPaySession?.expires_at && countdown === '00:00' && !success;

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          ← {backLabel}
        </Link>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-20 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {itemType === 'bundle' ? 'Bundle Purchase' : 'Course Enrollment'}
              </p>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
                {title}
              </h1>
              <p className="text-on-surface-variant leading-relaxed">{description}</p>
              {fetchError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {fetchError}
                </p>
              ) : null}
            </section>

            {error ? (
              <p className="px-4 py-3.5 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="px-4 py-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
                {success}
              </p>
            ) : null}

            {!promptPaySession ? (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('manual')}
                    className={`text-left rounded-3xl border p-6 transition-all ${
                      paymentMethod === 'manual'
                        ? 'border-primary bg-white shadow-lg shadow-primary/10'
                        : 'border-outline-variant/50 bg-white/80'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                      Manual Review
                    </p>
                    <h2 className="text-xl font-headline font-bold mb-2">Bank transfer slip</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Transfer to the company account, upload your slip, and an admin will approve
                      the purchase.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`text-left rounded-3xl border p-6 transition-all ${
                      paymentMethod === 'promptpay'
                        ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-100'
                        : 'border-outline-variant/50 bg-white/80'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
                      Instant Approval
                    </p>
                    <h2 className="text-xl font-headline font-bold mb-2">PromptPay via PaySolution</h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Generate a QR code, pay in your banking app, and unlock access after webhook
                      confirmation.
                    </p>
                  </button>
                </section>

                {paymentMethod === 'manual' ? (
                  <>
                    <section className="bg-surface-container-low rounded-2xl p-8 space-y-4 border-l-4 border-primary">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">
                        โอนเงินมาที่
                      </p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-sm text-on-surface-variant">ธนาคาร</span>
                          <span className="text-sm font-semibold text-on-surface text-right">
                            {BANK_INFO.bank}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-sm text-on-surface-variant">ชื่อบัญชี</span>
                          <span className="text-sm font-semibold text-on-surface text-right">
                            {BANK_INFO.accountName}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-sm text-on-surface-variant">เลขบัญชี</span>
                          <span className="text-sm font-semibold text-on-surface text-right">
                            {BANK_INFO.accountNumber}
                          </span>
                        </div>
                      </div>
                    </section>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <input
                        ref={fileRef}
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        disabled={submitting || !!success}
                        onChange={(event) => handleFileSelect(event.target.files?.[0])}
                      />

                      <div
                        role="button"
                        tabIndex={submitting || success ? -1 : 0}
                        aria-disabled={submitting || !!success}
                        onClick={() => fileRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            fileRef.current?.click();
                          }
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragOver(false);
                          handleFileSelect(event.dataTransfer.files?.[0]);
                        }}
                        className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
                          dragOver
                            ? 'border-primary bg-primary/5'
                            : 'border-outline-variant bg-surface-container-low hover:border-primary/50'
                        } ${submitting || success ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {preview ? (
                          <div className="relative">
                            <img src={preview} alt="Slip preview" className="w-full max-h-64 object-contain bg-surface-container" />
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/35 to-transparent p-4">
                              <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-on-surface">
                                {selectedFile?.name}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                clearFile();
                              }}
                              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container">
                              <span className="material-symbols-outlined text-3xl text-outline">
                                upload_file
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">
                                Drag and drop or <span className="text-primary underline">choose a file</span>
                              </p>
                              <p className="mt-1 text-xs text-outline">JPG, PNG, WEBP up to 2 MB</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/30 disabled:opacity-60"
                        type="submit"
                        disabled={submitting || !!success}
                      >
                        {submitting ? 'Submitting...' : 'Submit payment slip'}
                      </button>
                    </form>
                  </>
                ) : (
                  <section className="rounded-[32px] border border-emerald-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92))] p-8 shadow-xl shadow-emerald-100/60">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
                          PromptPay
                        </p>
                        <h2 className="text-2xl font-headline font-extrabold tracking-tight">
                          Generate a live QR code
                        </h2>
                        <p className="mt-2 text-sm text-on-surface-variant max-w-[44ch] leading-relaxed">
                          We create one PaySolution payment session and wait for the webhook to mark
                          it approved. Keep this page open until the status changes.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-emerald-600 px-4 py-3 text-right text-white min-w-[110px]">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/80">
                          Total
                        </p>
                        <p className="text-lg font-extrabold">{formatCurrency(item.price)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="mt-8 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 disabled:opacity-60"
                    >
                      {submitting ? 'Generating QR...' : 'Generate PromptPay QR'}
                    </button>
                  </section>
                )}
              </>
            ) : (
              <section className="rounded-[32px] border border-emerald-100 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_42%),linear-gradient(180deg,#ffffff_0%,#f4fff9_100%)] p-8 shadow-2xl shadow-emerald-100/70">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
                      Waiting for payment
                    </p>
                    <h2 className="text-3xl font-headline font-extrabold tracking-tight">
                      Scan the PromptPay QR
                    </h2>
                    <p className="mt-2 max-w-[42ch] text-sm text-on-surface-variant leading-relaxed">
                      The backend polls your payment state through the authenticated status endpoint.
                      Approval only happens when the PaySolution webhook confirms success.
                    </p>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-right ${qrExpired ? 'bg-red-50 text-red-700' : 'bg-emerald-600 text-white'}`}>
                    <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Expires in</p>
                    <p className="text-2xl font-extrabold">{countdown}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,340px)_1fr] md:items-start">
                  <div className={`rounded-[28px] border border-white/70 bg-white p-5 shadow-lg ${qrExpired ? 'opacity-50 grayscale' : ''}`}>
                    <img
                      src={promptPaySession.qr_image}
                      alt="PromptPay QR"
                      className="w-full rounded-2xl bg-white object-contain"
                    />
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-3xl border border-outline-variant/30 bg-white/90 p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                        Payment details
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-on-surface-variant">Amount</span>
                          <span className="font-semibold">{formatCurrency(promptPaySession.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-on-surface-variant">Order reference</span>
                          <span className="font-mono text-xs">{promptPaySession.order_ref}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-on-surface-variant">Status</span>
                          <span className="font-semibold text-emerald-700">
                            {qrExpired ? 'Expired' : 'Pending confirmation'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-3xl border p-6 ${qrExpired ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-800'}`}>
                      <p className="text-sm font-semibold">
                        {qrExpired
                          ? 'This QR code has expired. Generate a new one to continue with PromptPay.'
                          : 'Waiting for the PaySolution webhook. Once confirmed, access is approved automatically.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {qrExpired ? (
                        <button
                          type="button"
                          onClick={regeneratePromptPayPayment}
                          disabled={submitting}
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {submitting ? 'Generating...' : 'Generate new QR'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={cancelPromptPayPayment}
                        disabled={submitting}
                        className="inline-flex items-center justify-center rounded-2xl border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface disabled:opacity-60"
                      >
                        Back to payment methods
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-8 rounded-[32px] border border-outline-variant/30 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="p-8 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    {summaryLabel}
                  </p>
                  <h2 className="text-2xl font-headline font-bold tracking-tight">
                    {item.title}
                  </h2>
                </div>

                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="w-full aspect-video rounded-3xl object-cover" />
                ) : (
                  <div className="w-full aspect-video rounded-3xl bg-surface-container" />
                )}

                <div className="space-y-4">
                  {summaryMeta.map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-on-surface-variant">{entry.label}</span>
                      <span className="font-semibold text-right">{entry.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t border-surface-container">
                  <div className="flex justify-between text-on-surface-variant font-medium text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-on-surface text-lg pt-1">
                    <span>Total</span>
                    <span className="text-primary-container">{formatCurrency(item.price)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 pt-0">
                <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-emerald-600">qr_code_2</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    PromptPay Ready
                  </span>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-primary">verified_user</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Secure Approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
