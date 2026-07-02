import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function TicketQR({ ticket }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && ticket?.ticketId) {
      QRCode.toCanvas(canvasRef.current, ticket.ticketId, {
        width: 200,
        margin: 1,
        color: { dark: '#0E0E12', light: '#F5F3EF' },
      });
    }
  }, [ticket?.ticketId]);

  const isVip = ticket.ticketType === 'VIP';

  return (
    <div className="card relative overflow-hidden p-6">
      <div
        className={`absolute right-0 top-0 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider
          ${isVip ? 'bg-amber-500 text-ink-950' : 'bg-coral-500 text-ink-950'}`}
        style={{ borderBottomLeftRadius: '0.75rem' }}
      >
        {ticket.ticketType}
      </div>

      <p className="label-eyebrow">
        Ticket {ticket.ticketNumber} of {ticket.totalInOrder}
      </p>

      <div className="my-5 flex justify-center rounded-xl bg-bone-100 p-4">
        <canvas ref={canvasRef} />
      </div>

      <p className="text-center font-mono text-xs tracking-wide text-bone-400">{ticket.ticketId}</p>

      <p className="mt-3 text-center font-body text-sm text-bone-600">
        Show this QR at the entrance
      </p>

      {ticket.used && (
        <div className="mt-3 rounded-lg bg-coral-500/10 px-3 py-2 text-center font-mono text-xs font-semibold text-coral-400">
          Already checked in
        </div>
      )}
    </div>
  );
}
