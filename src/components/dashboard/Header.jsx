import { Search, Bell, ChevronDown, HelpCircle, UserCog } from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'
import { useRole, ROLES } from '../../theme/RoleContext'

export default function Header({ title, subtitle }) {
  const { theme } = useTheme()
  const { role, setRole } = useRole()
  const t2 = theme === 'theme2'
  return (
    <header
      className={`flex h-[68px] shrink-0 items-center justify-between border-b px-6 ${
        t2 ? 'border-transparent bg-primary text-primary-foreground' : 'border-gray-200 bg-white'
      }`}
    >
      <div>
        <h1 className={`text-lg font-bold leading-tight ${t2 ? 'text-primary-foreground' : 'text-heading'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-xs ${t2 ? 'text-primary-foreground/70' : 'text-body'}`}>{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${t2 ? 'text-primary-foreground/60' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search anything…"
            className={`w-64 rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition ${
              t2
                ? 'border border-white/20 bg-white/10 text-primary-foreground placeholder:text-primary-foreground/50 focus:bg-white/20'
                : 'border border-gray-200 bg-grey-light focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10'
            }`}
          />
        </div>

        <button className={`grid h-9 w-9 place-items-center rounded-lg transition ${iconBtn(t2)}`}>
          <HelpCircle className="h-5 w-5" />
        </button>

        <button className={`relative grid h-9 w-9 place-items-center rounded-lg transition ${iconBtn(t2)}`}>
          <Bell className="h-5 w-5" />
          <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ${t2 ? 'bg-emerald-300 ring-2 ring-primary' : 'bg-primary ring-2 ring-white'}`} />
        </button>

        {/* Role switcher — drives permissions across the app */}
        <div
          className={`relative flex items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
            t2
              ? 'border-white/20 bg-white/10 hover:bg-white/15'
              : 'border-gray-200 bg-white hover:border-primary/40'
          }`}
        >
          <span className={`grid h-6 w-6 place-items-center rounded-md ${t2 ? 'bg-white/15 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
            <UserCog className="h-3.5 w-3.5" />
          </span>
          <div className="hidden leading-tight sm:block">
            <span className={`block text-[10px] uppercase tracking-wide ${t2 ? 'text-primary-foreground/50' : 'text-gray-400'}`}>
              Role
            </span>
            <span className={`block text-sm font-semibold ${t2 ? 'text-primary-foreground' : 'text-heading'}`}>
              {role}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 ${t2 ? 'text-primary-foreground/60' : 'text-gray-400'}`} />
          {/* transparent native select overlays the whole control for accessibility */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Switch role"
            title="Switch role"
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <span className={`mx-1 h-8 w-px ${t2 ? 'bg-white/20' : 'bg-gray-200'}`} />

        <div className="flex items-center gap-2 py-1 pl-1 pr-2">
          <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${t2 ? 'bg-white/20 text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
            AK
          </span>
          <span className="hidden text-left sm:block">
            <span className={`block text-sm font-semibold leading-tight ${t2 ? 'text-primary-foreground' : 'text-heading'}`}>Admin User</span>
            <span className={`block text-[11px] leading-tight ${t2 ? 'text-primary-foreground/60' : 'text-gray-400'}`}>{role}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

const iconBtn = (t2) =>
  t2 ? 'text-primary-foreground/80 hover:bg-white/10' : 'text-body hover:bg-grey-light'
