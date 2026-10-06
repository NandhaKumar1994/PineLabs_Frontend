/**
 * Generic HTTP verbs on top of the shared axios instance (apiClient).
 *
 * Domain services (instanceService, ...) call these instead of touching
 * axios directly, so request shaping and response unwrapping live in ONE
 * place:
 *   - responses are unwrapped to `response.data` for JSON callers
 *   - `download()` returns the raw Blob for file endpoints (CSV/xlsx)
 *   - `upload()` sends multipart/form-data (axios sets the boundary)
 * All errors arrive already normalized to ApiError by apiClient's
 * response interceptor.
 */
import apiClient from './apiClient'

export const httpService = {
  async get(url, params, config = {}) {
    const response = await apiClient.get(url, { params, ...config })
    return response.data
  },

  async post(url, data, config = {}) {
    const response = await apiClient.post(url, data, config)
    return response.data
  },

  async put(url, data, config = {}) {
    const response = await apiClient.put(url, data, config)
    return response.data
  },

  async patch(url, data, config = {}) {
    const response = await apiClient.patch(url, data, config)
    return response.data
  },

  async delete(url, config = {}) {
    const response = await apiClient.delete(url, config)
    return response.data
  },

  /** GET a binary file (CSV/xlsx/etc.) as a Blob. */
  async download(url, params, config = {}) {
    const response = await apiClient.get(url, { params, responseType: 'blob', ...config })
    return response.data
  },

  /**
   * POST multipart/form-data. Pass a FormData instance (or a plain
   * object of field->value, which is converted). The Content-Type +
   * boundary is set by the browser/axios automatically.
   */
  async upload(url, formData, config = {}) {
    const body =
      formData instanceof FormData
        ? formData
        : Object.entries(formData || {}).reduce((fd, [key, value]) => {
            fd.append(key, value)
            return fd
          }, new FormData())
    const response = await apiClient.post(url, body, config)
    return response.data
  },
}
