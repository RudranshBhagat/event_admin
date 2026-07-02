export default function StatCard({ label, value, accent = 'bone' }) {
  const accentClass = {
    bone: 'text-bone-100',
    coral: 'text-coral-400',
    amber: 'text-amber-400',
  }[accent];

  return (
    <div className="card p-5">
      <p className="label-eyebrow mb-2">{label}</p>
      <p className={`font-display text-4xl ${accentClass}`}>{value}</p>
    </div>
  );
}
