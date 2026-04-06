export interface StatsCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatsCard({ label, value, hint }: StatsCardProps) {
  return (
    <article className="panel admin-stats-card">
      <p>{label}</p>
      <h3>{value}</h3>
      {hint && <small>{hint}</small>}
    </article>
  );
}
