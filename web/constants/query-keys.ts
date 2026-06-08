enum QueryKey {
  projects = 'projects',
  page_rules = 'page_rules',
  builds = 'builds',
  build_logs = 'build_logs',
  snapshots = 'snapshots',
}

export const listProjectsQueryKey = (params?: unknown) =>
  params ? [QueryKey.projects, 'list', params] : [QueryKey.projects, 'list']

export const detailProjectQueryKey = (projectId: string) => [QueryKey.projects, projectId]

export const listPageRulesByProjectQueryKey = (projectId: string, type?: 'tree' | 'yaml') =>
  type ? [QueryKey.page_rules, projectId, type] : [QueryKey.page_rules, projectId]

export const listBuildsByProjectQueryKey = (projectId: string, params?: unknown) =>
  params ? [QueryKey.builds, 'list', projectId, params] : [QueryKey.builds, 'list', projectId]

export const detailBuildQueryKey = (buildId: string) => [QueryKey.builds, buildId]

export const listBuildLogsQueryKey = (buildId: string, params?: unknown) =>
  params ? [QueryKey.build_logs, 'list', buildId, params] : [QueryKey.build_logs, 'list', buildId]

export const listSnapshotsByBuildQueryKey = (buildId: string) => [QueryKey.snapshots, 'list', buildId]
