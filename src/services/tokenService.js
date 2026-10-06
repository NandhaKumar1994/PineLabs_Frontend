/**
 * Auth token storage.
 *
 * The real Pine Labs SSO/OIDC provider isn't wired up on the backend
 * yet (see PineLabs_Backend/app/core/auth.py). Locally, the backend's
 * opt-in DevAuthenticationProvider treats the bearer token as a user's
 * email and resolves it against its own `users` table. The token the
 * sign-in screen captures is persisted in localStorage here; if none is
 * set, callers fall back to env.devAuthEmail (see apiClient's request
 * interceptor) so the app works right after `npm run dev`.
 *
 * Kept as its own module (not baked into the axios client) so token
 * concerns are isolated and easily swapped when real auth lands.
 */
import { env } from '../config/env'

const AUTH_TOKEN_KEY = 'pinelabs.authToken'

export const tokenService = {
  /** The stored session token, or the dev fallback, or '' if neither. */
  get() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || env.devAuthEmail || ''
  },

  /** Persist a session token (or clear it when falsy). */
  set(token) {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
    else localStorage.removeItem(AUTH_TOKEN_KEY)
  },

  /** Remove any stored session token (dev fallback still applies on get). */
  clear() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },
}
