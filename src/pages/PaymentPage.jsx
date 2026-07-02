import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitUpiPayment, ApiError } from '../lib/api.js';
import paymentQR from '../assets/paymentQR.jpeg';

const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'Balaghat Event';
const UPI_ID = (import.meta.env.VITE_UPI_ID || 'organizer@upi').trim();
const UPI_PAYEE_NAME = import.meta.env.VITE_UPI_PAYEE_NAME || EVENT_NAME;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded bg-bone-100/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-bone-300 hover:bg-bone-100/20 hover:text-bone-100 transition-colors uppercase tracking-wider"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

export default function PaymentPage() {
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('pending_booking') || 'null');
      if (!saved) {
        navigate('/');
        return;
      }
      const pricePerTicket = saved.ticketType === 'VIP'
        ? parseInt(import.meta.env.VITE_PRICE_VIP || '1000', 10)
        : parseInt(import.meta.env.VITE_PRICE_GENERAL || '500', 10);
      const totalAmount = pricePerTicket * saved.quantity;

      setOrder({
        ...saved,
        pricePerTicket,
        totalAmount,
      });
    } catch {
      navigate('/');
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanUpiTxnId = upiTxnId.trim();
    if (!/^\d{12}$/.test(cleanUpiTxnId)) {
      setError('Please enter a valid 12-digit UPI Transaction ID / UTR.');
      return;
    }

    setLoading(true);
    try {
      await submitUpiPayment({
        name: order.name,
        email: order.email,
        phone: order.phone,
        city: order.city || '',
        ticketType: order.ticketType,
        quantity: order.quantity,
        upiTransactionId: cleanUpiTxnId,
      });

      // Clear pending booking
      sessionStorage.removeItem('pending_booking');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!order) return null;

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-3xl">
            ⏳
          </div>
          <h1 className="font-display text-4xl uppercase text-bone-100 sm:text-5xl">
            Details Received
          </h1>
          <p className="mt-4 font-body text-sm text-bone-300 leading-relaxed">
            Thank you! We are verifying your payment details. You will receive your tickets via email within 24 hours after payment confirmation.
          </p>

          <div className="card mt-8 p-6 text-left space-y-3 font-mono text-xs text-bone-400">
            <div className="flex justify-between border-b border-bone-100/10 pb-2">
              <span>Order Reference:</span>
              <span className="text-bone-100 font-bold">{upiTxnId}</span>
            </div>
            <div className="flex justify-between border-b border-bone-100/10 pb-2">
              <span>Transaction Reference:</span>
              <span className="text-bone-100 font-bold">{upiTxnId}</span>
            </div>
            <div className="flex justify-between border-b border-bone-100/10 pb-2">
              <span>Email:</span>
              <span className="text-bone-100 font-bold">{order.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="text-bone-100 font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn-primary mt-8 w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="label-eyebrow">Step 2 of 2</p>
          <h1 className="mt-2 font-display text-4xl uppercase text-bone-100 sm:text-5xl">
            Pay with UPI
          </h1>
          <p className="mt-3 font-body text-sm text-bone-400 max-w-lg mx-auto leading-relaxed">
            Scan the QR code below or pay directly to the UPI ID. Once paid, submit your UTR number for manual confirmation.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-5 items-start">
          {/* Column 1: Payment Details & QR Code (3/5 width on desktop) */}
          <div className="card p-6 space-y-6 md:col-span-3">
            <h2 className="label-eyebrow">1. Complete Payment</h2>

            <div className="flex flex-col items-center gap-6 justify-center">
              <div className="rounded-2xl bg-bone-100 p-3 shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={paymentQR}
                  alt="UPI QR Code"
                  className="w-[280px] h-[280px] object-contain rounded-xl sm:w-[320px] sm:h-[320px]"
                />
              </div>
              <div className="w-full max-w-md space-y-4">
                <div className="space-y-1">
                  <span className="block text-xs uppercase tracking-wider text-bone-500 font-mono">UPI ID to Pay</span>
                  <div className="flex items-center justify-between rounded-xl bg-ink-900/60 border border-bone-100/10 px-3 py-2.5">
                    <span className="font-mono text-sm text-bone-100 font-medium">{UPI_ID}</span>
                    <CopyButton text={UPI_ID} />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="block text-xs uppercase tracking-wider text-bone-500 font-mono">Amount</span>
                  <div className="flex items-center justify-between rounded-xl bg-ink-900/60 border border-bone-100/10 px-3 py-2.5">
                    <span className="font-display text-lg text-amber-400 font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    <CopyButton text={String(order.totalAmount)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-bone-100/5 px-4 py-3 font-body text-xs text-bone-400 leading-relaxed border border-bone-100/10">
              💡 <span className="font-semibold text-bone-200">How to pay:</span> Open GPay, PhonePe, Paytm, or your banking app. Use the **Scan QR** option to scan the QR above, or manually pay to the UPI ID.
            </div>
          </div>

          {/* Column 2: Booking Summary & Verification (2/5 width on desktop) */}
          <div className="space-y-6 md:col-span-2">
            <div className="card p-6">
              <h2 className="label-eyebrow mb-3">Booking Summary</h2>
              <dl className="space-y-2 font-mono text-xs text-bone-400">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="text-bone-200">{order.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-bone-200 break-all">{order.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="text-bone-200">{order.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket Type:</span>
                  <span className="text-bone-200">{order.ticketType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="text-bone-200">{order.quantity}</span>
                </div>
                <div className="flex justify-between border-t border-bone-100/10 pt-2 text-sm">
                  <span className="font-semibold text-bone-200">Total:</span>
                  <span className="font-bold text-amber-400">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="label-eyebrow mb-4">2. Submit Reference</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider text-bone-300 font-mono">UPI Transaction ID / UTR</label>
                  <input
                    type="text"
                    value={upiTxnId}
                    onChange={(e) => setUpiTxnId(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                    placeholder="12-digit transaction number"
                    className="input-field"
                    required
                  />
                  <p className="text-[10px] font-mono text-bone-600">
                    UPI reference number / UTR is usually a 12-digit number found on your payment receipt.
                  </p>
                </div>

                {error && (
                  <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400 border border-coral-500/20">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !upiTxnId}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-ink-950" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying details...
                    </>
                  ) : (
                    'Submit Verification Details'
                  )}
                </button>
              </form>
            </div>

            <button
              onClick={() => navigate('/')}
              className="block w-full text-center font-mono text-xs text-bone-600 hover:text-bone-400 transition-colors"
            >
              ← Cancel &amp; Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
