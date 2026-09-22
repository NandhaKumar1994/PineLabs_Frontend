import { createContext, useContext, useMemo, useState } from 'react'

export const ROLES = ['Admin', 'SME', 'Automation', 'Viewer']

// Permission model derived from the current role.
// Module visibility flags: canViewBin (BIN Series), canManageUsers (User Management).
function permsFor(role) {
  switch (role) {
    case 'Admin':
      return { canCreate: true, canEdit: true, canDelete: true, canUpload: true, canManageUsers: true, canViewHistory: true, canViewBin: true, canViewAutomation: true, canManageInstances: true }
    case 'SME':
      // Subject matter expert: manages SOP data but has no BIN Series access.
      return { canCreate: true, canEdit: true, canDelete: false, canUpload: true, canManageUsers: false, canViewHistory: true, canViewBin: false, canViewAutomation: false, canManageInstances: false }
    case 'Automation':
      // Automation team: full data access + Automation Dashboard, no User Management.
      return { canCreate: true, canEdit: true, canDelete: true, canUpload: true, canManageUsers: false, canViewHistory: true, canViewBin: true, canViewAutomation: true, canManageInstances: false }
    case 'Viewer':
    default:
      return { canCreate: false, canEdit: false, canDelete: false, canUpload: false, canManageUsers: false, canViewHistory: false, canViewBin: true, canViewAutomation: false, canManageInstances: false }
  }
}

const RoleContext = createContext({ role: 'Admin', setRole: () => {}, perms: permsFor('Admin') })

export function RoleProvider({ children }) {
  const [role, setRole] = useState('Admin')
  const perms = useMemo(() => permsFor(role), [role])
  return (
    <RoleContext.Provider value={{ role, setRole, perms }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
