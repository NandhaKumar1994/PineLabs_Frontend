/**
 * Instance Management domain service — the single API surface the
 * Instance Management UI talks to (see components/admin/InstanceManagement.jsx).
 * Field names match the backend's camelCase schemas exactly
 * (PineLabs_Backend/app/schemas/instance.py); no renaming happens here.
 * All methods return already-unwrapped data and throw ApiError on
 * failure (both handled by httpService / apiClient).
 */
import { endpoints } from './endpoints'
import { httpService } from './httpService'

export const instanceService = {
  /** Paginated, searchable, filterable, sortable list. */
  list({ page = 1, pageSize = 50, search, status, sortBy, sortOrder } = {}) {
    return httpService.get(endpoints.instances.root, {
      page,
      pageSize,
      search,
      status,
      sortBy,
      sortOrder,
    })
  },

  /** A single instance by id. */
  getById(id) {
    return httpService.get(endpoints.instances.byId(id))
  },

  /** Header cards: { totalInstances, activeInstances, issuersGrouped }. */
  getStats() {
    return httpService.get(endpoints.instances.stats)
  },

  /** Create — { name, status?, ticketNumber?, customFields? }.
   *  Create does NOT capture Revised By / Reviewer (edit/delete only). */
  create(payload) {
    return httpService.post(endpoints.instances.root, payload)
  },

  /** Partial update; also the activate/deactivate control via `status`. */
  update(id, payload) {
    return httpService.put(endpoints.instances.byId(id), payload)
  },

  /**
   * Delete by id, recording the deletion audit.
   * audit: { ticketNumber, revisedBy, reviewer } — all mandatory
   * (enforced by the Delete Instance dialog and the backend schema).
   * Sent as the DELETE request body.
   */
  remove(id, audit) {
    return httpService.delete(endpoints.instances.byId(id), { data: audit })
  },

  /** Export matching instances as a CSV Blob (respects search/status). */
  export({ search, status } = {}) {
    return httpService.download(endpoints.instances.export, { search, status })
  },

  /** Download the import template as a CSV Blob. */
  getImportTemplate() {
    return httpService.download(endpoints.instances.importTemplate)
  },

  /**
   * Bulk import a CSV/XLSX file — single upsert-by-name flow. On
   * validation failure the backend rejects the whole file (422) with
   * per-row problems in the thrown ApiError's `details.errors`.
   *
   * Uses a generous per-request timeout (2 min) that overrides the app's
   * default: a large multi-sheet workbook (thousands of rows) can take
   * longer than a normal API call to process server-side, and the
   * default timeout would abort it with a misleading "no response"
   * error even though the import is still running.
   */
  import(file) {
    const form = new FormData()
    form.append('file', file)
    return httpService.upload(endpoints.instances.import, form, { timeout: 120000 })
  },

  /**
   * Submit a MULTI-FILE background import job. Accepts an array of File
   * objects, uploads them all as multipart/form-data (field name `files`,
   * matching the backend's `files: List[UploadFile]`), and returns
   * immediately with { jobId, status: "queued", totalFiles } — the actual
   * import runs in the background. Poll getImportJob(jobId) for progress
   * and getImportJobErrors(jobId) for the structured failures.
   *
   * Uses a generous timeout only for the UPLOAD leg (transferring the raw
   * bytes can take a while for many/large files); processing itself does
   * not hold this request open.
   */
  submitImportJob(files) {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    return httpService.upload(endpoints.instances.importJobs, form, { timeout: 120000 })
  },

  /** Live progress for a job: the files -> sheets tree + roll-up counters. */
  getImportJob(jobId) {
    return httpService.get(endpoints.instances.importJobById(jobId))
  },

  /** Structured errors for a job: [{ file, sheet, row, messages[] }]. */
  getImportJobErrors(jobId) {
    return httpService.get(endpoints.instances.importJobErrors(jobId))
  },
}
