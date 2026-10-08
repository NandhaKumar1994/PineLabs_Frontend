import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { roleService } from '../services/roleService'

// New role vocabulary (kept in lockstep with the backend —
// PineLabs_Backend/app/models/user.py ROLE_VALUES and
// app/core/permissions.py):
//   Super Admin — all access, including User Management
//   Admin       — all access EXCEPT User Management
//   SME         — BIN view; SOP full CRUD; Generic Dashboard + Revision History view
//   Viewer      — BIN / SOP / Generic Dashboard view-only (no Revision History)
export const ROLES = ['Super Admin', 'Admin', 'SME', 'Viewer']

const DEFAULT_ROLE = 'Super Admin'

// Full permission flag set, so a role map never has implicit gaps.
const ALL_FLAGS = [
  'canManageUsers',
  'canManageInstances',
  'canViewBin',
  'canEditBin',
  'canViewAutomation',
  'canViewHistory',
  'canCreate',
  'canEdit',
  'canDelete',
  'canUpload',
]

const noPerms = () => Object.fromEntries(ALL_FLAGS.map((f) => [f, false]))

// Local fallback permission map — mirrors the backend's
// app/core/permissions.py. Used until GET /roles resolves (and if it
// ever fails), so the UI is never left without a permission model.
// canEditBin is split from the generic SOP write flags so SME can be
// BIN view-only while still having full SOP CRUD.
const FALLBACK_PERMISSIONS = {
  'Super Admin': {
    ...noPerms(),
    canManageUsers: true,
    canManageInstances: true,
    canViewBin: true,
    canEditBin: true,
    canViewAutomation: true,
    canViewHistory: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canUpload: true,
  },
  Admin: {
    ...noPerms(),
    canManageInstances: true,
    canViewBin: true,
    canEditBin: true,
    canViewAutomation: true,
    canViewHistory: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canUpload: true,
  },
  SME: {
    ...noPerms(),
    canViewBin: true,
    canViewHistory: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canUpload: true,
  },
  Viewer: {
    ...noPerms(),
    canViewBin: true,
  },
}

const permsFor = (role, map) => (map && map[role]) || FALLBACK_PERMISSIONS[role] || noPerms()

const RoleContext = createContext({
  role: DEFAULT_ROLE,
  setRole: () => {},
  roles: ROLES,
  perms: FALLBACK_PERMISSIONS[DEFAULT_ROLE],
})

export function RoleProvider({ children }) {
  const [role, setRole] = useState(DEFAULT_ROLE)
  // Role -> permission map, seeded from the fallback and replaced by the
  // backend's /roles payload once it loads.
  const [permissionMap, setPermissionMap] = useState(FALLBACK_PERMISSIONS)
  const [roles, setRoles] = useState(ROLES)

  useEffect(() => {
    let cancelled = false
    roleService
      .list()
      .then((data) => {
        if (cancelled || !data?.roles?.length) return
        const map = {}
        const names = []
        for (const r of data.roles) {
          map[r.name] = { ...noPerms(), ...(r.permissions || {}) }
          names.push(r.name)
        }
        setPermissionMap(map)
        setRoles(names)
        // Keep the active role valid if the server vocabulary differs.
        setRole((cur) => (names.includes(cur) ? cur : names[0]))
      })
      .catch(() => {
        // Keep the fallback map — the UI stays usable offline / pre-auth.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const perms = useMemo(() => permsFor(role, permissionMap), [role, permissionMap])

  return (
    <RoleContext.Provider value={{ role, setRole, roles, perms }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
