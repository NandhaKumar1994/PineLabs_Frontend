import { Database, Building2, Layers } from 'lucide-react'
import { binSeries } from '../../data/binSeries'
import { useTheme } from '../../theme/ThemeContext'

const uniqueIssuers = new Set(binSeries.map((r) => r.issuer)).size
const uniquePrograms = new Set(binSeries.map((r) => r.cardProgramGroupName)).size

const stats = [
  { icon: Database, label: 'Total Records', value: binSeries.length },
  { icon: Building2, label: 'Issuers', value: uniqueIssuers },
  { icon: Layers, label: 'Card Programs', value: uniquePrograms },
]

export default function StatCards() {
  const { theme } = useTheme()

  // Theme 2: horizontal 3-column strip (full width). Theme 1: vertical stack.
  if (theme === 'theme2') {
    return (
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none text-heading">{value}</p>
              <p className="mt-0.5 text-xs text-body">{label}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-gray-100">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5 lg:flex-1 lg:rounded-none lg:border-0"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold leading-none text-heading">{value}</p>
            <p className="mt-0.5 truncate text-xs text-body">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
