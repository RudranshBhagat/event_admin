import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recoverTicket, ApiError } from '../lib/api.js';

export default function RetrieveTicket() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | { found, message }
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const res = await recoverTicket(email.trim());
      setStatus(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setStatus(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="label-eyebrow text-center">Lost your tickets?</p>
        <h1 className="mt-2 text-center font-display text-3xl uppercase text-bone-100 sm:text-4xl">
          Resend my tickets
        </h1>
        <p className="mt-3 text-center font-body text-sm text-bone-400">
          Enter the email you used at checkout — we'll resend everything.
        </p>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
          <div>
            <label className="mb-1.5 block font-body text-sm font-medium text-bone-200">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
              {error}
            </p>
          )}

          {status && status !== 'loading' && (
            <p
              className={`rounded-lg px-3 py-2 text-center font-body text-sm ${
                status.found
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-bone-100/5 text-bone-400'
              }`}
            >
              {status.message ||
                (status.found
                  ? `We've resent your ${status.quantity} ticket${status.quantity > 1 ? 's' : ''} to ${email}`
                  : 'No tickets found for this email.')}
            </p>
          )}

          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? 'Searching…' : 'Resend tickets'}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center font-mono text-xs text-bone-600 hover:text-bone-400">
          ← Back to event page
        </Link>
      </div>
    </div>
  );
}
