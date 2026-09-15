import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function LoginCard({ onSignIn }) {
  const [ssoLoading, setSsoLoading] = useState(false)

  const handleSSO = () => {
    setSsoLoading(true)
    // Kick off the AD / SSO redirect flow here (e.g. window.location = authUrl)
    setTimeout(() => {
      setSsoLoading(false)
      onSignIn?.()
    }, 1600)
  }

  return (
    <div className="relative flex items-center justify-center bg-white px-8 py-12 sm:px-12">
      <div className="w-full max-w-sm animate-fade-in-up text-center">
        <img
          src="https://plcorp-cdn.pinelabs.com/2025/03/logo.svg"
          alt="Pine Labs"
          className="mx-auto h-9 w-auto"
        />

        <h2 className="mt-10 text-3xl font-extrabold text-heading">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-body">
          Sign in with your Active Directory account to continue
        </p>

        <button
          type="button"
          onClick={handleSSO}
          disabled={ssoLoading}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          {ssoLoading ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              Redirecting to Active Directory…
            </>
          ) : (
            <>
              <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true">
                <path fill="#f25022" d="M1 1h10v10H1z" />
                <path fill="#7fba00" d="M12 1h10v10H12z" />
                <path fill="#00a4ef" d="M1 12h10v10H1z" />
                <path fill="#ffb900" d="M12 12h10v10H12z" />
              </svg>
              Sign in with Active Directory
            </>
          )}
        </button>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secured by your organization's Active Directory
        </p>
      </div>
    </div>
  )
}
