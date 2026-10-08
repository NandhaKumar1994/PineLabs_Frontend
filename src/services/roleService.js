/**
 * Roles domain service — fetches the role vocabulary + per-role
 * permission map from the backend (GET /api/v1/roles), which is the
 * single source of truth (PineLabs_Backend/app/core/permissions.py).
 * The UI used to hardcode this in RoleContext.jsx; now it loads it.
 */
import { endpoints } from './endpoints'
import { httpService } from './httpService'

export const roleService = {
  /** { roles: [{ name, permissions: {canCreate, ...} }] }. */
  list() {
    return httpService.get(endpoints.roles.root)
  },
}
