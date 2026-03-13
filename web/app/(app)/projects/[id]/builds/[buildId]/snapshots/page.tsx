'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Route } from 'next'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE, snapshotsMenu } from '@/constants/app'
import { QUERY_KEY_BUILDS, QUERY_KEY_PROJECTS, QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { BuildStatus } from '@/constants/status-map'
import { getBuildDetail, resumeBuild } from '@/features/builds/actions'
import { BuildSummaryCard } from '@/features/builds/summary'
import { getProject } from '@/features/projects/actions'
import { SnapshotListCard } from '@/features/snapshots/list'
import { type NavigationType } from '@/types/app'

export default function BuildDetailSnapshotsPage() {
  const params = useParams<{ id: string; buildId: string }>()
  const queryClient = useQueryClient()

  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const { data: buildData, isLoading: isLoadingBuild } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, params.id, params.buildId],
    queryFn: () => getBuildDetail({ projectId: params.id, buildId: params.buildId }),
    refetchInterval: ({ state }) => {
      const buildStatus = state.data?.status
      if (buildStatus === BuildStatus.PENDING || buildStatus === BuildStatus.IN_PROGRESS) {
        return 10_000
      }

      if (buildStatus === BuildStatus.ERROR) {
        return 2_000
      }

      return false
    },
  })

  const resume = useMutation({
    mutationFn: () => resumeBuild({ projectId: params.id, buildId: params.buildId }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Build resumed', { description: 'The build has been requested to resume.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BUILDS, params.id] })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BUILDS, params.id, params.buildId] })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SNAPSHOTS, params.id, params.buildId] })
        return
      }

      toast.error('Failed to resume build', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  const isLoading = isLoadingProject || isLoadingBuild

  const breadcrumbs = useMemo(
    () =>
      projectData && buildData ? (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/projects">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}`}>{projectData.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}/builds` as Route}>Builds</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{buildData.identifier}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [projectData, buildData, params],
  )
  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  const navigations = useMemo<NavigationType[]>(
    () => snapshotsMenu(params.id, params.buildId),
    [params.id, params.buildId],
  )
  useHeaderNavigations(navigations)

  if (!isLoading && !buildData) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
      <BuildSummaryCard build={buildData} onResume={() => resume.mutate()} isResumePending={resume.isPending} />

      <SnapshotListCard build={buildData} />
    </div>
  )
}
