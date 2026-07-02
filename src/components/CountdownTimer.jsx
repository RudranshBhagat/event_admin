import { useEffect, useState } from 'react';

function getTimeLeft(target) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isOver: diff <= 0,
  };
}

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hrs' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sec' },
];

export default function CountdownTimer({ targetDate }) {
  const target = new Date(targetDate).getTime();
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time.isOver) {
    return (
      <div className="font-display text-2xl tracking-wide text-coral-400">
        Doors are open — see you inside.
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2.5 sm:gap-4" role="timer" aria-live="polite">
      {UNITS.map((unit, i) => (
        <div key={unit.key} className="flex items-end gap-2.5 sm:gap-4">
          <div className="flex flex-col items-center">
            <div
              className="relative flex h-16 w-14 items-center justify-center overflow-hidden rounded-xl
                bg-ink-800 ring-1 ring-bone-100/10 sm:h-24 sm:w-20"
              style={{ perspective: '200px' }}
            >
              <span
                key={time[unit.key]}
                className="font-mono text-2xl font-bold tabular-nums text-bone-100 sm:text-4xl animate-rise"
                style={{ animationDuration: '0.4s' }}
              >
                {String(time[unit.key]).padStart(2, '0')}
              </span>
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-ink-950/60" />
            </div>
            <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-bone-400 sm:text-xs">
              {unit.label}
            </span>
          </div>
          {i < UNITS.length - 1 && (
            <span className="mb-6 font-display text-xl text-coral-500/60 sm:mb-9 sm:text-2xl">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
