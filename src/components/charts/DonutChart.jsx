// Lightweight themed donut chart (pure SVG, no deps).
const COLORS = ['rgb(var(--c-primary))', 'var(--c-accent-from)', '#14b8a6', '#5eead4', '#99f6e4']

export default function DonutChart({ data, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = 40
  const circ = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total
          const dash = frac * circ
          const seg = (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return seg
        })}
        {/* center hole label */}
        <circle cx="50" cy="50" r="26" fill="#fff" />
      </svg>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-body">{d.label}</span>
            <span className="ml-auto shrink-0 font-semibold text-heading">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
