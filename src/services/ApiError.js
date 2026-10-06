/**
 * Normalized application error thrown by the API layer.
 *
 * The backend's error envelope (see
 * PineLabs_Backend/app/core/error_handlers.py) is always
 *   { "error": { "code": "...", "message": "...", "details": ... } }
 * Every failed request is surfaced to callers/UI as an ApiError carrying
 * those three fields plus the HTTP status, so components can show
 * `err.message` and branch on `err.code` / inspect `err.details`
 * (e.g. the per-row import failures in `details.errors`).
 */
export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN_ERROR', details = null, status } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.status = status
  }

  /** Build an ApiError from an axios error, decoding the backend envelope. */
  static fromAxiosError(error) {
    // The server responded with a non-2xx status.
    if (error.response) {
      const { status, data } = error.response
      const envelope = data && data.error
      if (envelope) {
        return new ApiError(envelope.message || 'Request failed.', {
          code: envelope.code,
          details: envelope.details ?? null,
          status,
        })
      }
      return new ApiError(`Request failed with status ${status}.`, { status })
    }
    // The request was made but no response was received (network/timeout).
    if (error.request) {
      return new ApiError('No response from server. Check your connection and try again.', {
        code: 'NETWORK_ERROR',
      })
    }
    // Something else went wrong building the request.
    return new ApiError(error.message || 'Unexpected error.', { code: 'CLIENT_ERROR' })
  }
}
