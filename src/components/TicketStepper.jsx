export default function TicketStepper({ value, onChange, max = 10, min = 1, disabled = false }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border border-bone-100/15 bg-ink-900/60 px-4 py-3 transition-opacity ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="font-body text-sm font-semibold text-bone-100">Number of tickets</p>
        <p className="font-mono text-[11px] text-bone-600">Max {max} per order</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          aria-label="Decrease ticket count"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-bone-100/20
            text-lg font-bold text-bone-100 transition-colors
            hover:border-coral-500/60 hover:text-coral-400
            disabled:opacity-30 disabled:pointer-events-none"
        >
          −
        </button>
        <span className="w-8 text-center font-display text-2xl text-bone-100">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          aria-label="Increase ticket count"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-bone-100/20
            text-lg font-bold text-bone-100 transition-colors
            hover:border-coral-500/60 hover:text-coral-400
            disabled:opacity-30 disabled:pointer-events-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
