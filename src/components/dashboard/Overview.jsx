import { useState } from 'react'
import {
  CreditCard,
  Store,
  Users,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
} from 'lucide-react'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'
import { binSeries } from '../../data/binSeries'
import { merchants } from '../../data/sopData'
import { users } from '../../data/users'
import { revisions } from '../../data/revisions'
import { recentTickets, statusBadge } from '../../data/tickets'
import { useTheme } from '../../theme/ThemeContext'
import TicketsModal from './TicketsModal'
import StatusReasonInfo from './StatusReasonInfo'

const kpis = [
  { icon: CreditCard, label: 'BIN Records', value: binSeries.length.toLocaleString(), delta: '+12%', up: true },
  { icon: Store, label: 'Merchant SOPs', value: merchants.length.toLocaleString(), delta: '+4%', up: true },
  { icon: Users, label: 'Active Users', value: users.filter((u) => u.status === 'Active').length, delta: '+2', up: true },
  { icon: History, label: 'Changes (7d)', value: revisions.length, delta: '-3%', up: false },
]

const ticketData = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 51 },
  { label: 'Thu', value: 67 },
  { label: 'Fri', value: 74 },
  { label: 'Sat', value: 38 },
  { label: 'Sun', value: 29 },
]

const classCounts = merchants.reduce((acc, m) => {
  acc[m.classification] = (acc[m.classification] || 0) + 1
  return acc
}, {})
const classData = Object.entries(classCounts).map(([label, value]) => ({ label, value }))

const topIssuers = [
  { name: 'HDFC Bank', pct: 92 },
  { name: 'ICICI Bank', pct: 78 },
  { name: 'State Bank of India', pct: 64 },
  { name: 'Axis Bank', pct: 51 },
]

export default function Overview() {
  const { theme } = useTheme()
  if (theme === 'theme2') return <OverviewT2 />

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
      <div className="grid shrink-0 grid-cols-2 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {kpis.map(({ icon: Icon, label, value, delta, up }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-extrabold leading-none text-heading">{value}</p>
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                    up ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {delta}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-body">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-heading">Tickets Resolved</h3>
              <p className="text-[11px] text-body">Last 7 days</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              +18%
            </span>
          </div>
          <BarChart data={ticketData} height={180} />
        </div>

        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-heading">SOP by Classification</h3>
          <p className="text-[11px] text-body">Merchant workbook mix</p>
          <div className="flex flex-1 items-center justify-center">
            <DonutChart data={classData} size={150} />
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-gray-100 px-4 py-2.5">
            <h3 className="text-sm font-bold text-heading">Recent Activity</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-50">
                {revisions.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-primary/[0.03]">
                    <td className="px-4 py-2">
                      <p className="text-sm font-medium text-heading">{r.user}</p>
                      <p className="text-xs text-body">
                        {r.action} · {r.entity}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-body">{r.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-gray-100 px-4 py-2.5">
            <h3 className="text-sm font-bold text-heading">Top Issuers by Volume</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-50">
                {topIssuers.map((t, i) => (
                  <tr key={t.name} className="hover:bg-primary/[0.03]">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-heading">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-grey-light sm:block">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold text-heading">{t.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TicketStatusCard />
    </div>
  )
}

function OverviewT2() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-0.5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value, delta, up }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-body">{label}</span>
              <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-heading">{value}</p>
            <span
              className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${
                up ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta} this week
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-heading">SOP by Classification</h3>
          <p className="text-[11px] text-body">Merchant workbook mix</p>
          <div className="flex flex-1 items-center justify-center">
            <DonutChart data={classData} size={150} />
          </div>
        </div>
        <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-heading">Tickets Resolved</h3>
              <p className="text-[11px] text-body">Last 7 days</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              +18%
            </span>
          </div>
          <BarChart data={ticketData} height={180} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-bold text-heading">Top Issuers by Volume</h3>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-1 p-4 sm:grid-cols-2">
          {topIssuers.map((t, i) => (
            <div key={t.name} className="flex items-center gap-3 py-1.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <span className="w-40 truncate text-sm font-medium text-heading">{t.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-grey-light">
                <div className="h-full rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="w-9 text-right text-xs font-semibold text-heading">{t.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-bold text-heading">Recent Activity</h3>
        </div>
        <ul className="divide-y divide-gray-50">
          {revisions.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center justify-between px-5 py-2.5">
              <div>
                <p className="text-sm font-medium text-heading">{r.user}</p>
                <p className="text-xs text-body">
                  {r.action} · {r.entity} · {r.target}
                </p>
              </div>
              <span className="text-xs text-body">{r.timestamp}</span>
            </li>
          ))}
        </ul>
      </div>

      <TicketStatusCard elevated />
    </div>
  )
}

function TicketStatusCard({ elevated = false }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className={`flex shrink-0 flex-col overflow-hidden border border-gray-200 bg-white shadow-sm ${
          elevated ? 'rounded-lg' : 'rounded-xl'
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-between border-b border-gray-100 ${
            elevated ? 'px-5 py-3' : 'px-4 py-2.5'
          }`}
        >
          <h3 className="text-sm font-bold text-heading">Tickets by Status</h3>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open full tickets table"
            title="Open full table"
            className="grid h-8 w-8 place-items-center rounded-lg text-body transition hover:bg-grey-light hover:text-heading"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Ticket', 'Subject', 'Issuer', 'Status', 'Updated', ''].map((col, i) => (
                  <th
                    key={col || `info-${i}`}
                    className="whitespace-nowrap px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTickets.map((row) => (
                <tr key={row.id} className="hover:bg-primary/[0.03]">
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-heading sm:px-5">{row.id}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-heading sm:px-5">{row.subject}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-body sm:px-5">{row.issuer}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-body sm:px-5">{row.updated}</td>
                  <td className="w-10 px-3 py-2.5 text-right sm:px-4">
                    <StatusReasonInfo status={row.status} reason={row.reason} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && <TicketsModal onClose={() => setOpen(false)} />}
    </>
  )
}
