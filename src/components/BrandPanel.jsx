import { Mail, Table2, Workflow, Sparkles, CheckCircle2 } from 'lucide-react'
import { useTheme } from '../theme/ThemeContext'

const highlights = [
  { icon: Table2, text: 'Redirection rules moved from Excel to live data' },
  { icon: Workflow, text: 'Loan-number routing with full CRUD control' },
]

export default function BrandPanel() {
  const { theme } = useTheme()
  const t2 = theme === 'theme2'
  return (
    <div
      className="relative hidden overflow-hidden text-primary-foreground lg:flex lg:flex-col"
      style={{
        backgroundImage:
          'linear-gradient(to bottom right, var(--c-accent-from), rgb(var(--c-primary)), var(--c-accent-to))',
      }}
    >
      {/* decorative glow + grid */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[28rem] w-[28rem] rounded-full bg-teal-400/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* wavy edge into the form panel — Theme 1 only (Theme 2 uses a flat edge) */}
      {!t2 && (
        <svg
          className="pointer-events-none absolute inset-y-0 right-[-1px] h-full w-24 translate-x-full"
          viewBox="0 0 100 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 0 H30 C60 90 0 150 35 220 C65 290 5 340 30 400 H0 Z" fill="#ffffff" opacity="0.12" />
          <path d="M0 0 H15 C45 90 -15 150 20 220 C50 290 -10 340 15 400 H0 Z" fill="#ffffff" />
        </svg>
      )}

      {/* mail illustration — right side, near the description text */}
      <div className="pointer-events-none absolute right-40 top-1/2 z-0 -translate-y-1/2 opacity-40" aria-hidden="true">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-emerald-300/20 blur-2xl" />
          <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Mail className="h-14 w-14" strokeWidth={1.6} />
          </div>
          <span className="absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full bg-emerald-400/90 text-primary shadow-lg">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <span className="absolute -bottom-3 -left-3 grid h-8 w-8 place-items-center rounded-full bg-white text-primary shadow-lg">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </span>
        </div>
      </div>

      {/* top: logo */}
      <header className="relative z-10 flex items-center justify-between px-16 pt-14">
        <img
          src="https://plcorp-cdn.pinelabs.com/2025/03/logo.svg"
          alt="Pine Labs"
          className="h-8 w-auto brightness-0 invert"
        />
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
          Helpdesk Automation
        </span>
      </header>

      {/* middle: headline */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-16">
        <h1 className="max-w-lg text-5xl font-extrabold leading-[1.1]">
          Turn helpdesk emails into{' '}
          <span className="bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent">
            automated responses
          </span>
          .
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
          Manage customer redirection rules and let the platform draft accurate
          responses automatically.
        </p>

        <ul className="mt-8 space-y-4">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 backdrop-blur">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm text-white/85">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* bottom: footer */}
      <footer className="relative z-10 px-16 pb-14 text-xs text-white/40">
        © {new Date().getFullYear()} Pine Labs · Helpdesk Automation Console
      </footer>
    </div>
  )
}
