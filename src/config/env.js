/**
 * Centralized, typed access to Vite environment variables.
 *
 * Everything that reads `import.meta.env` in the app goes through here,
 * so there's exactly one place that knows the variable names and their
 * defaults — components/services never touch `import.meta.env` directly.
 */

const trimTrailingSlashes = (value) => String(value || '').replace(/\/+$/, '')

export const env = Object.freeze({
  /** Base URL of the PineLabs backend, including the /api/v1 prefix. */
  apiBaseUrl: trimTrailingSlashes(
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
  ),

  /**
   * LOCAL DEV ONLY — fallback bearer token (a user's email) used when no
   * session token has been stored yet, so the app works immediately
   * after `npm run dev`. Only meaningful while the backend's
   * DEV_AUTH_ENABLED=true. See PineLabs_Backend/app/core/auth.py.
   */
  devAuthEmail: import.meta.env.VITE_DEV_AUTH_EMAIL || '',

  /** Request timeout in milliseconds. */
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
})
