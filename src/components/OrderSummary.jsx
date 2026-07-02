export default function OrderSummary({ ticketType, quantity, pricePerTicket, onSubmit, loading, ctaLabel = 'Proceed to Payment' }) {
  const subtotal = quantity * pricePerTicket;
  const feesAndTaxes = 0; // Inclusive in ticket price
  const total = subtotal + feesAndTaxes;

  return (
    <div className="card p-5">
      <p className="label-eyebrow mb-3">Order summary</p>
      <div className="space-y-2 border-b border-bone-100/10 pb-3 font-body text-sm">
        <div className="flex items-center justify-between">
          <span className="text-bone-400">
            {ticketType} Ticket &times; {quantity}
          </span>
          <span className="font-mono text-bone-200">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-bone-500">
          <span>GST &amp; Booking Fees</span>
          <span>Inclusive</span>
        </div>
      </div>
      <div className="flex items-center justify-between py-4">
        <span className="font-body font-semibold text-bone-100">Total Amount</span>
        <span className="font-display text-2xl text-amber-400">
          ₹{total.toLocaleString('en-IN')}
        </span>
      </div>
      <button 
        type="button" 
        onClick={onSubmit} 
        disabled={loading} 
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-ink-950" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Please wait…</span>
          </>
        ) : (
          ctaLabel
        )}
      </button>
    </div>
  );
}
