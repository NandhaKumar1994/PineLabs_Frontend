/**
 * The single axios instance for the whole app, with interceptors that
 * centralize the two cross-cutting concerns:
 *
 *   1. REQUEST  — attach `Authorization: Bearer <token>` from
 *      tokenService to every outgoing request.
 *   2. RESPONSE — on failure, reject with a normalized ApiError decoded
 *      from the backend's error envelope, so no caller ever has to know
 *      about axios error shapes.
 *
 * Callers should use httpService (get/post/put/...) rather than this
 * instance directly; this file just wires the axios instance itself.
 */
import axios from 'axios'

import { env } from '../config/env'
import { ApiError } from './ApiError'
import { tokenService } from './tokenService'

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: { Accept: 'application/json' },
})

// --- Request interceptor: attach the bearer token. -------------------
apiClient.interceptors.request.use((config) => {
  const token = tokenService.get()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response interceptor: normalize every error to an ApiError. -----
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(ApiError.fromAxiosError(error))
)

export default apiClient
