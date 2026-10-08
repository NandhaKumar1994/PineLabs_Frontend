/**
 * Single source of truth for backend endpoint paths, relative to the
 * API base URL (env.apiBaseUrl already includes /api/v1). Domain
 * services reference these constants instead of hardcoding path strings,
 * so a route change is a one-line edit here.
 */
export const endpoints = {
  instances: {
    root: '/instances',
    byId: (id) => `/instances/${id}`,
    stats: '/instances/stats',
    export: '/instances/export',
    import: '/instances/import',
    importTemplate: '/instances/import/template',
    // Background multi-file import job (submit -> poll progress -> errors).
    importJobs: '/instances/import/jobs',
    importJobById: (id) => `/instances/import/jobs/${id}`,
    importJobErrors: (id) => `/instances/import/jobs/${id}/errors`,
    columns: '/instances/columns',
    columnById: (id) => `/instances/columns/${id}`,
    columnsReorder: '/instances/columns/reorder',
    // Issuers grouped under a given instance (derived from BIN data).
    issuers: (id) => `/instances/${id}/issuers`,
  },
  users: {
    root: '/users',
    byId: (id) => `/users/${id}`,
    stats: '/users/stats',
    export: '/users/export',
    import: '/users/import',
    importTemplate: '/users/import/template',
    columns: '/users/columns',
    columnById: (id) => `/users/columns/${id}`,
    columnsReorder: '/users/columns/reorder',
  },
  roles: {
    root: '/roles',
  },
}
