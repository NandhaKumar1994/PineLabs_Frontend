// Lightweight themed vertical bar chart. Bars are sized in pixels (derived
// from the plot height) so they always render regardless of flex quirks.
export default function BarChart({ data, height = 180 }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="w-full">
      {/* plot area */}
      <div
        className="relative flex items-end justify-between gap-2"
        style={{ height }}
      >
        {/* gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-px w-full bg-gray-100" />
          ))}
        </div>

        {data.map((d) => (
          <div key={d.label} className="relative flex flex-1 justify-center">
            <div
              className="w-6 rounded-t"
              style={{
                height: Math.max((d.value / max) * height, 2),
                backgroundColor: 'rgb(var(--c-primary))',
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        ))}
      </div>

      {/* labels aligned to bars */}
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center">
            <p className="text-sm font-bold text-heading">{d.value}</p>
            <p className="text-[11px] text-body">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
