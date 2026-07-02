import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '';
console.log(ADMIN_PIN)

export default function AdminLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    if (!ADMIN_PIN) {
      setError('Admin PIN is not configured. Set VITE_ADMIN_PIN in the frontend .env file.');
      return;
    }

    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('admin_authed', 'true');
      navigate('/admin/scan');
      return;
    }

    setError('Incorrect PIN.');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-7">
        <p className="label-eyebrow text-center">Staff access</p>
        <h1 className="mt-2 text-center font-display text-3xl uppercase text-bone-100">
          Gate scanner
        </h1>

        <div className="mt-7">
          <label className="mb-1.5 block font-body text-sm font-medium text-bone-200">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            autoFocus
            className="input-field text-center tracking-[0.5em]"
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary mt-6 w-full">
          Enter
        </button>
      </form>
    </div>
  );
}