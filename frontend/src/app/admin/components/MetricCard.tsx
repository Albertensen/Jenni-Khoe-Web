interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export default function MetricCard({ label, value, change, positive }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-luxury-charcoal">{value}</p>
      {change && (
        <p className={`text-xs mt-2 ${positive ? "text-green-600" : "text-red-500"}`}>
          {positive ? "↑" : "↓"} {change}
        </p>
      )}
    </div>
  );
}
