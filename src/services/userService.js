/**
 * User Management domain service — the API surface the User Management
 * UI talks to. Field names match the backend's camelCase schemas
 * (PineLabs_Backend/app/schemas/user.py). Methods return already-
 * unwrapped data and throw ApiError on failure (handled by httpService).
 *
 * CRUD can go through either the dedicated REST verbs OR the single
 * consolidated endpoint POST /users/manage (see `manage`), which the
 * backend dispatches by `operation`. The screen uses `manage` so all
 * mutations flow through one call shape.
 */
import { endpoints } from './endpoints'
import { httpService } from './httpService'

export const userService = {
  /** Paginated, searchable, filterable, sortable list. */
  list({ page = 1, pageSize = 50, search, role, status, sortBy, sortOrder } = {}) {
    return httpService.get(endpoints.users.root, {
      page,
      pageSize,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    })
  },

  /** A single user by id, including resolved SOP sheet access. */
  getById(id) {
    return httpService.get(endpoints.users.byId(id))
  },

  /**
   * Consolidated CRUD via POST /users/manage.
   * create: manage('create', { data })
   * update: manage('update', { userId, data })
   * delete: manage('delete', { userId })
   */
  manage(operation, { userId, data } = {}) {
    return httpService.post(endpoints.users.root + '/manage', { operation, userId, data })
  },

  /** Convenience wrappers over `manage`. */
  create(data) {
    return this.manage('create', { data })
  },
  update(userId, data) {
    return this.manage('update', { userId, data })
  },
  remove(userId) {
    return this.manage('delete', { userId })
  },
}
