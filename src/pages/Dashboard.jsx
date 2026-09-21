import { useEffect, useState } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { useRole } from '../theme/RoleContext'
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import StatCards from '../components/dashboard/StatCards'
import BinResolver from '../components/dashboard/BinResolver'
import BinTable from '../components/dashboard/BinTable'
import SopDashboard from '../components/sop/SopDashboard'
import UserManagement from '../components/admin/UserManagement'
import RevisionHistory from '../components/admin/RevisionHistory'
import Overview from '../components/dashboard/Overview'

const titles = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your helpdesk automation data' },
  bin: { title: 'BIN Series', subtitle: 'Look up card issuers and manage BIN ranges' },
  sop: { title: 'SOP Dashboard', subtitle: 'Issuer standard operating procedures by instance & classification' },
  users: { title: 'User Management', subtitle: 'Manage users, roles and access' },
  history: { title: 'Revision History', subtitle: 'Audit trail of all changes' },
}

export default function Dashboard() {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const { perms } = useRole()

  // If the current view is not permitted for the selected role, redirect out.
  useEffect(() => {
    if (active === 'users' && !perms.canManageUsers) setActive('dashboard')
    if (active === 'history' && !perms.canViewHistory) setActive('dashboard')
    if (active === 'bin' && !perms.canViewBin) setActive('dashboard')
  }, [active, perms])

  const meta = titles[active]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-grey-bg">
      <Sidebar
        active={active}
        onSelect={setActive}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={meta.title} subtitle={meta.subtitle} />

        <main className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
          {active === 'dashboard' ? (
            <Overview />
          ) : active === 'sop' ? (
            <SopDashboard />
          ) : active === 'users' ? (
            <UserManagement />
          ) : active === 'history' ? (
            <RevisionHistory />
          ) : (
            <BinView />
          )}
        </main>
      </div>
    </div>
  )
}

function BinView() {
  const { theme } = useTheme()

  // Theme 2: resolver full-width hero on top, stats as a horizontal strip
  // below it, then the reference table — a stacked, single-column layout.
  if (theme === 'theme2') {
    return (
      <>
        <BinResolver />
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <StatCards />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-heading">All BIN Series</h3>
          </div>
          <BinTable />
        </div>
      </>
    )
  }

  return (
    <>
      {/* top: resolver + stats side by side */}
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <BinResolver />
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <StatCards />
        </div>
      </div>

      {/* bottom: reference table fills remaining space, scrolls internally */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-heading">Reference · All BIN Series</h3>
          <p className="text-xs text-body">Browse and manage the full sheet</p>
        </div>
        <BinTable />
      </div>
    </>
  )
}
