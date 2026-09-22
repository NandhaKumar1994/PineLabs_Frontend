import { Bot, CheckCircle2, AlertTriangle, Zap, Activity, Gauge, TrendingUp } from 'lucide-react'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'
import {
  runStatus,
  totalRuns,
  autoResolved,
  failedRuns,
  manualReview,
  automationRate,
  runsPerDay,
  outcomeMix,
  apiUsage,
  totalApiCalls,
  avgLatency,
  failureReasons,
  coverageByClassification,
  recentRuns,
  runBadge,
} from '../../data/automation'

const kpis = [
  { icon: Bot, label: 'Automation Runs', value: totalRuns.toLocaleString(), hint: 'Last 7 days' },
  { icon: CheckCircle2, label: 'Auto Resolved', value: autoResolved.toLocaleString(), hint: `${automationRate}% of runs` },
  { icon: AlertTriangle, label: 'Needs Attention', value: (manualReview + failedRuns).toLocaleString(), hint: 'Manual review + failed' },
  { icon: Zap, label: 'API Calls', value: totalApiCalls.toLocaleString(), hint: `${avgLatency} ms avg` },
]

export default function AutomationDashboard() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto nice-scroll pr-0.5">
      {/* KPIs */}
      <div className="grid shrink-0 grid-cols-2 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {kpis.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/5 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none text-heading">{value}</p>
              <p className="mt-0.5 truncate text-xs text-body">{label}</p>
              <p className="truncate text-[11px] text-gray-400">{hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* automation rate banner */}
      <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
          <Gauge className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-heading">Automation Rate</p>
          <p className="text-xs text-body">Tickets closed by automation without human intervention</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-grey-light sm:w-56">
            <div className="h-full rounded-full bg-primary" style={{ width: `${automationRate}%` }} />
          </div>
          <span className="text-xl font-extrabold text-heading">{automationRate}%</span>
        </div>
      </div>

      {/* runs trend + outcome mix */}
      <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-heading">Automation Runs</h3>
              <p className="text-[11px] text-body">Last 7 days</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              +22%
            </span>
          </div>
          <BarChart data={runsPerDay} height={170} />
        </div>

        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-heading">Run Outcomes</h3>
          <p className="text-[11px] text-body">Status mix across all runs</p>
          <div className="flex flex-1 items-center justify-center">
            <DonutChart data={outcomeMix} size={140} />
          </div>
        </div>
      </div>

      {/* ticket status by automation + coverage */}
      <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-heading">Ticket Status</h3>
          <p className="mb-3 text-[11px] text-body">Where automated tickets currently stand</p>
          <ul className="space-y-2.5">
            {runStatus.map((s) => {
              const pct = Math.round((s.count / totalRuns) * 100)
              return (
                <li key={s.name}>
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                    <span className="truncate text-body">{s.name}</span>
                    <span className="ml-auto shrink-0 font-semibold text-heading">
                      {s.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-grey-light">
                    <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-heading">Automation Coverage</h3>
          <p className="mb-3 text-[11px] text-body">Share handled automatically, by classification</p>
          <ul className="space-y-2.5">
            {coverageByClassification.map((c) => (
              <li key={c.label}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="truncate text-body">{c.label}</span>
                  <span className="ml-auto shrink-0 font-semibold text-heading">{c.automated}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-grey-light">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.automated}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* API usage + failure reasons */}
      <div className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-gray-100 px-4 py-2.5">
            <h3 className="text-sm font-bold text-heading">API Consumption</h3>
            <p className="text-[11px] text-body">Endpoints called by the automation system</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-grey-light text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Endpoint</th>
                  <th className="px-4 py-2 font-semibold">Calls</th>
                  <th className="px-4 py-2 font-semibold">Avg</th>
                  <th className="px-4 py-2 font-semibold">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apiUsage.map((a) => (
                  <tr key={a.endpoint}>
                    <td className="px-4 py-2 font-mono text-xs font-medium text-heading">{a.endpoint}</td>
                    <td className="px-4 py-2 text-body">{a.calls.toLocaleString()}</td>
                    <td className="px-4 py-2 text-body">{a.avgMs} ms</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                          a.errorPct >= 0.8 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {a.errorPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-heading">Top Failure Reasons</h3>
          <p className="mb-3 text-[11px] text-body">Why runs could not complete automatically</p>
          <ul className="space-y-2">
            {failureReasons.map((f) => (
              <li
                key={f.reason}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="min-w-0 flex-1 truncate text-body">{f.reason}</span>
                <span className="shrink-0 rounded-md bg-grey-light px-1.5 py-0.5 font-semibold text-heading">
                  {f.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* recent runs */}
      <div className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2.5">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-heading">Recent Automation Runs</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-light text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Run ID</th>
                <th className="px-4 py-2 font-semibold">Ticket</th>
                <th className="px-4 py-2 font-semibold">Issuer</th>
                <th className="px-4 py-2 font-semibold">Classification</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Duration</th>
                <th className="px-4 py-2 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentRuns.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2 font-semibold text-heading">{r.id}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-body">{r.ticket}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-body">{r.issuer}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-body">{r.classification}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        runBadge[r.status] || 'bg-grey-light text-body'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-body">
                    {(r.durationMs / 1000).toFixed(1)}s
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-body">{r.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
