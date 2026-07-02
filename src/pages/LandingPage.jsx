import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer.jsx';
import TicketStepper from '../components/TicketStepper.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { registerOrder, ApiError } from '../lib/api.js';

const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'Balaghat Event';
const EVENT_DATE = import.meta.env.VITE_EVENT_DATE || 'July 7, 2026';
const EVENT_VENUE = import.meta.env.VITE_EVENT_VENUE || 'Sheetal Palace, Balaghat';
const PRICE_GENERAL = Number(import.meta.env.VITE_PRICE_GENERAL || 500);
const PRICE_VIP = Number(import.meta.env.VITE_PRICE_VIP || 1200);
const MAX_TICKETS = Number(import.meta.env.VITE_MAX_TICKETS || 10);

const USER_ICON = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EMAIL_ICON = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PHONE_ICON = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const PIN_ICON = (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DRAFT_KEY = 'event_form_draft';

export default function LandingPage() {
  const navigate = useNavigate();

  const [draftRestored, setDraftRestored] = useState(false);
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (saved) {
        setDraftRestored(true);
        return saved;
      }
    } catch {
      /* ignore */
    }
    return { name: '', email: '', phone: '', city: '', ticketType: 'General', quantity: 1 };
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function validateField(fieldName, value) {
    if (fieldName === 'name') {
      return value.trim() ? '' : 'Enter your full name.';
    }
    if (fieldName === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address.';
    }
    if (fieldName === 'phone') {
      const digits = value.replace(/\s+/g, '');
      return /^\d{10}$/.test(digits) ? '' : 'Enter a valid 10-digit mobile number.';
    }
    return '';
  }

  function updateForm(patch) {
    const next = { ...form, ...patch };
    setForm(next);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  }

  function updateField(fieldName, value) {
    const next = { ...form, [fieldName]: value };
    setForm(next);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));

    if (touched[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
    }
  }

  function handleBlur(fieldName) {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    setErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, form[fieldName]) }));
  }

  function validate() {
    const e = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      phone: validateField('phone', form.phone),
    };
    setErrors(e);
    return !e.name && !e.email && !e.phone;
  }

  async function handleSubmit() {
    setApiError('');
    
    // Mark all as touched
    const allTouched = { name: true, email: true, phone: true };
    setTouched(allTouched);

    if (!validate()) {
      // Scroll to the first field that has an error
      const firstError = ['name', 'email', 'phone'].find((k) => validateField(k, form[k]));
      if (firstError) {
        const el = document.getElementById(`field-${firstError}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      sessionStorage.setItem(
        'pending_booking',
        JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          ticketType: form.ticketType,
          quantity: form.quantity,
        })
      );

      localStorage.removeItem(DRAFT_KEY);
      navigate('/payment');
    } catch (err) {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectPriceCard = (type) => {
    updateForm({ ticketType: type });
    const formEl = document.getElementById('tickets');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const pricePerTicket = form.ticketType === 'VIP' ? PRICE_VIP : PRICE_GENERAL;

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-coral-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="label-eyebrow animate-rise">{EVENT_DATE} &middot; {EVENT_VENUE}</p>

      {/* image */}
          <div className="mt-8 animate-rise" style={{ animationDelay: '0.03s' }}>
  <div className="relative mx-auto overflow-hidden rounded-2xl shadow-2xl shadow-coral-500/20"
    style={{ maxWidth: 'min(320px, 85vw)' }}>
    <img
      src="/guest_img.jpg"
      alt="Guest artist"
      className="w-full object-cover"
    />
    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent" />
  </div>
</div>
          

          <h1
            className="mt-4 font-display text-5xl uppercase leading-[0.95] tracking-tight text-bone-100 animate-rise sm:text-7xl md:text-8xl"
            style={{ animationDelay: '0.05s' }}
          >
            {EVENT_NAME}
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl font-body text-base text-bone-400 animate-rise sm:text-lg"
            style={{ animationDelay: '0.1s' }}
          >
            One night. One stage. Tickets are moving fast — lock yours in before the gates fill up.
          </p>

          <div className="mt-10 flex justify-center animate-rise" style={{ animationDelay: '0.15s' }}>
            <CountdownTimer targetDate={EVENT_DATE} />
          </div>

          <div className="mt-10 animate-rise" style={{ animationDelay: '0.2s' }}>
            <a href="#tickets" className="btn-primary animate-pulseRing">
              Book Tickets
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust signals ────────────────────────────────────────────────── */}
      <section className="border-y border-bone-100/10 bg-ink-800/40 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-center">
          <Stat value="2,400+" label="past attendees" />
          <Stat value="4.8/5" label="average rating" />
          <Stat value="Secure" label="UPI payments" />
        </div>
      </section>

      {/* ── Pricing comparison ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="label-eyebrow text-center">Choose your ticket</p>
          <h2 className="mt-2 text-center font-display text-3xl uppercase text-bone-100 sm:text-4xl">
            Pick your spot
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <PriceCard
              type="General"
              price={PRICE_GENERAL}
              features={['Standard entry', 'General standing area', 'Access to all stages']}
              selected={form.ticketType === 'General'}
              onSelect={() => handleSelectPriceCard('General')}
            />
            <PriceCard
              type="VIP"
              price={PRICE_VIP}
              featured
              features={['Priority entry — skip the line', 'Dedicated VIP lounge', 'Front-of-stage viewing', 'Complimentary welcome drink']}
              selected={form.ticketType === 'VIP'}
              onSelect={() => handleSelectPriceCard('VIP')}
            />
          </div>
        </div>
      </section>

      {/* ── Embedded registration form ───────────────────────────────────── */}
      <section id="tickets" className="px-6 pb-28">
        <div className="mx-auto max-w-lg">
          <p className="label-eyebrow text-center">Almost there</p>
          <h2 className="mt-2 text-center font-display text-3xl uppercase text-bone-100 sm:text-4xl">
            Your details
          </h2>

          {draftRestored && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center sm:text-left font-body text-sm text-amber-400">
              <span>We saved your progress — pick up where you left off.</span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(DRAFT_KEY);
                    setForm({ name: '', email: '', phone: '', city: '', ticketType: 'General', quantity: 1 });
                    setErrors({});
                    setTouched({});
                    setDraftRestored(false);
                  }}
                  className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors uppercase tracking-wider"
                >
                  Start Fresh
                </button>
                <button
                  type="button"
                  onClick={() => setDraftRestored(false)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  aria-label="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="card mt-8 space-y-4 p-6">
            {/* Inline Ticket Type Toggle */}
            <div>
              <label className="mb-1.5 block font-body text-sm font-medium text-bone-200">Ticket Category</label>
              <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-ink-900/60 p-1.5 border border-bone-100/10">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateForm({ ticketType: 'General' })}
                  className={`rounded-lg py-2 text-center font-body text-sm font-semibold transition-all duration-200 ${
                    form.ticketType === 'General'
                      ? 'bg-coral-500 text-ink-950 font-bold shadow-md'
                      : 'text-bone-400 hover:text-bone-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  General (₹{PRICE_GENERAL})
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateForm({ ticketType: 'VIP' })}
                  className={`rounded-lg py-2 text-center font-body text-sm font-semibold transition-all duration-200 ${
                    form.ticketType === 'VIP'
                      ? 'bg-amber-500 text-ink-950 font-bold shadow-md'
                      : 'text-bone-400 hover:text-bone-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  VIP (₹{PRICE_VIP})
                </button>
              </div>
            </div>

            <Field
              id="field-name"
              label="Full name"
              value={form.name}
              onChange={(v) => updateField('name', v)}
              onBlur={() => handleBlur('name')}
              error={errors.name}
              isValid={touched.name && !errors.name}
              placeholder="Your name"
              icon={USER_ICON}
              disabled={loading}
              autoComplete="name"
            />
            <Field
              id="field-email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => updateField('email', v)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              isValid={touched.email && !errors.email}
              placeholder="you@example.com"
              icon={EMAIL_ICON}
              disabled={loading}
              autoComplete="email"
            />
            <Field
              id="field-phone"
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(v) => updateField('phone', v.replace(/[^\d]/g, '').slice(0, 10))}
              onBlur={() => handleBlur('phone')}
              error={errors.phone}
              isValid={touched.phone && !errors.phone}
              placeholder="98765 43210"
              prefix="+91"
              icon={PHONE_ICON}
              disabled={loading}
              autoComplete="tel"
            />
            <Field
              id="field-city"
              label="City (optional)"
              value={form.city}
              onChange={(v) => updateField('city', v)}
              placeholder="Your city"
              icon={PIN_ICON}
              disabled={loading}
              autoComplete="address-level2"
            />

            <TicketStepper
              value={form.quantity}
              onChange={(q) => updateForm({ quantity: q })}
              max={MAX_TICKETS}
              disabled={loading}
            />

            {apiError && (
              <p className="rounded-lg bg-coral-500/10 px-3 py-2 text-center font-body text-sm text-coral-400">
                {apiError}
              </p>
            )}
          </div>

          <div className="mt-5">
            <OrderSummary
              ticketType={form.ticketType}
              quantity={form.quantity}
              pricePerTicket={pricePerTicket}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>

          <p className="mt-6 text-center font-mono text-xs text-bone-600">
            Already booked?{' '}
            <a href="/retrieve-ticket" className="text-coral-400 underline-offset-2 hover:underline">
              Resend my tickets
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-bone-100/10 px-6 py-8 text-center font-mono text-xs text-bone-600">
        {EVENT_NAME} &middot; {EVENT_VENUE}
      </footer>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-xl text-amber-400">{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-bone-400">{label}</span>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  prefix,
  icon,
  disabled = false,
  autoComplete,
  isValid,
}) {
  let paddingLeftClass = 'pl-4';
  if (icon && prefix) {
    paddingLeftClass = 'pl-20';
  } else if (prefix) {
    paddingLeftClass = 'pl-12';
  } else if (icon) {
    paddingLeftClass = 'pl-11';
  }

  return (
    <div id={id}>
      <label className="mb-1.5 block font-body text-sm font-medium text-bone-200">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bone-500">
            {icon}
          </span>
        )}
        {prefix && (
          <span className={`absolute top-1/2 -translate-y-1/2 font-body text-bone-500 ${icon ? 'left-10' : 'left-4'}`}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`input-field ${paddingLeftClass} ${
            error
              ? 'border-coral-500/60 focus:border-coral-500 focus:ring-coral-500/20'
              : isValid
              ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20'
              : 'border-bone-100/15 focus:border-coral-500/60 focus:ring-coral-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {isValid && !error && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">
            ✓
          </span>
        )}
      </div>
      {error && <p className="mt-1 font-mono text-xs text-coral-400">{error}</p>}
    </div>
  );
}

function PriceCard({ type, price, features, featured, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all
        ${selected
          ? 'border-coral-500 bg-coral-500/[0.07] ring-2 ring-coral-500/30'
          : 'border-bone-100/10 bg-ink-800/40 hover:border-bone-100/25'}`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-amber-500 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-950">
          Most popular
        </span>
      )}
      <span className="label-eyebrow">{type}</span>
      <span className="mt-2 font-display text-4xl text-bone-100">
        ₹{price.toLocaleString('en-IN')}
      </span>
      <ul className="mt-5 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 font-body text-sm text-bone-400">
            <span className="mt-0.5 text-coral-400">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <div
        className={`mt-6 rounded-full border py-2 text-center font-mono text-xs font-bold uppercase tracking-wider transition-colors
          ${selected ? 'border-coral-500 bg-coral-500 text-ink-950' : 'border-bone-100/20 text-bone-400'}`}
      >
        {selected ? 'Selected' : 'Select'}
      </div>
    </button>
  );
}
