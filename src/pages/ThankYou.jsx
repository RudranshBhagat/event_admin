import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import TicketQR from '../components/TicketQR.jsx';
import { getOrderTickets, getDownloadUrl, ApiError } from '../lib/api.js';

export default function ThankYou() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setError('No order found.');
      setLoading(false);
      return;
    }
    getOrderTickets(orderId)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your tickets.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-bone-500">Loading your tickets…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="label-eyebrow">Something's off</p>
        <h1 className="font-display text-3xl text-bone-100">{error || 'Order not found'}</h1>
        <Link to="/retrieve-ticket" className="btn-secondary mt-2">Find my tickets</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-coral-500/15 text-2xl">
          ✅
        </div>
        <h1 className="font-display text-4xl uppercase text-bone-100 sm:text-5xl">Booking confirmed!</h1>
        <p className="mt-3 font-body text-bone-400">
          {data.name} &middot; {data.ticketType} &times; {data.quantity} &middot; Total ₹
          {data.totalAmount.toLocaleString('en-IN')}
        </p>

        <p className="label-eyebrow mt-10">
          Your tickets ({data.tickets.length})
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {data.tickets.map((t) => (
            <TicketQR key={t.ticketId} ticket={t} />
          ))}
        </div>

        <div className="card mt-10 p-5">
          <p className="font-body text-sm text-bone-300">
            📧 All tickets sent to <span className="font-medium text-bone-100">{data.email}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-bone-600">
            Check spam if not received within 2 minutes.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={getDownloadUrl(orderId)} className="btn-primary">
            Download all tickets
          </a>
          <Link to="/retrieve-ticket" className="btn-secondary">
            Didn't get the email?
          </Link>
        </div>
      </div>
    </div>
  );
}
