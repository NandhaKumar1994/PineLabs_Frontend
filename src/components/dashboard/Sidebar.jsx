import {
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  Bot,
  Layers,
  Users,
  History,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'
import { useRole } from '../../theme/RoleContext'

const allNav = [
  { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
  { icon: CreditCard, label: 'BIN Series', key: 'bin', requires: 'canViewBin' },
  { icon: ClipboardList, label: 'SOP Dashboard', key: 'sop' },
  { icon: Bot, label: 'Automation Dashboard', key: 'automation', requires: 'canViewAutomation' },
  { icon: Layers, label: 'Instance Management', key: 'instances', requires: 'canManageInstances' },
  { icon: Users, label: 'User Management', key: 'users', requires: 'canManageUsers' },
  { icon: History, label: 'Revision History', key: 'history', requires: 'canViewHistory' },
]

export default function Sidebar({ active, onSelect, collapsed, onToggle }) {
  const { theme } = useTheme()
  const { perms } = useRole()
  const light = theme === 'theme2'

  // Show only the items the current role is allowed to see.
  const nav = allNav.filter((item) => !item.requires || perms[item.requires])

  // Theme 2: light sidebar with dark text and a tinted active pill.
  // Theme 1: solid primary (dark) sidebar with light text.
  const asideCls = light
    ? 'border-r border-gray-200 bg-white text-heading'
    : 'bg-primary text-primary-foreground'
  const borderCls = light ? 'border-gray-200' : 'border-white/10'
  const logoCls = light ? 'h-6 w-auto' : 'h-6 w-auto brightness-0 invert'
  const toggleCls = light
    ? 'text-gray-400 hover:bg-grey-light hover:text-heading'
    : 'text-white/70 hover:bg-white/10 hover:text-white'
  const labelMutedCls = light ? 'text-gray-400' : 'text-white/40'

  const itemCls = (isActive) => {
    if (light) {
      return isActive
        ? 'bg-primary/10 text-primary'
        : 'text-body hover:bg-grey-light hover:text-heading'
    }
    return isActive
      ? 'bg-white/15 text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
  }

  return (
    <aside
      className={`relative hidden shrink-0 flex-col transition-all duration-300 lg:flex ${asideCls} ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* brand + toggle */}
      <div className={`flex h-16 items-center justify-between border-b px-4 ${borderCls}`}>
        {!collapsed && (
          <img
            src="https://plcorp-cdn.pinelabs.com/2025/03/logo.svg"
            alt="Pine Labs"
            className={logoCls}
          />
        )}
        <button
          onClick={onToggle}
          className={`grid h-9 w-9 place-items-center rounded-lg transition ${toggleCls} ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {!collapsed && (
          <p className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider ${labelMutedCls}`}>
            Workspace
          </p>
        )}
        {nav.map(({ icon: Icon, label, key }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              title={collapsed ? label : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${itemCls(
                isActive
              )} ${collapsed ? 'justify-center' : ''}`}
            >
              {/* Theme 1 uses a left accent bar; Theme 2 uses the pill only */}
              {isActive && !light && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-emerald-300" />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}

              {collapsed && (
                <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-md bg-heading px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* footer */}
      <div className={`border-t p-3 ${borderCls}`}>
        {!collapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                light ? 'bg-primary/10 text-primary' : 'bg-white/15 text-white'
              }`}
            >
              AK
            </span>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${light ? 'text-heading' : 'text-white'}`}>
                Admin User
              </p>
              <p className={`truncate text-xs ${light ? 'text-body' : 'text-white/50'}`}>
                admin@pinelabs.com
              </p>
            </div>
          </div>
        )}
        <div className="space-y-1">
          <SideAction icon={Settings} label="Settings" collapsed={collapsed} light={light} />
          <SideAction icon={LogOut} label="Sign out" collapsed={collapsed} light={light} />
        </div>
      </div>
    </aside>
  )
}

function SideAction({ icon: Icon, label, collapsed, light }) {
  const cls = light
    ? 'text-body hover:bg-grey-light hover:text-heading'
    : 'text-white/70 hover:bg-white/10 hover:text-white'
  return (
    <button
      title={collapsed ? label : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${cls} ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-md bg-heading px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  )
}
