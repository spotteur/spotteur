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
import { QUERY_KEY_BUILDS, QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { BuildStatus } from '@/constants/status-map'
import { getBuildDetail, resumeBuild } from '@/features/builds/actions'
import { BuildSummaryCard } from '@/features/builds/summary'
import { SnapshotListCard } from '@/features/snapshots/list'
import { type NavigationType } from '@/types/app'

export default function BuildDetailSnapshotsPage() {
  const params = useParams<{ buildId: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, params.buildId],
    queryFn: () => getBuildDetail({ buildId: params.buildId }),
    refetchInterval: ({ state }) => {
      const build = state.data?.build
      const buildStatus = build?.status
      if (buildStatus === BuildStatus.PENDING || buildStatus === BuildStatus.IN_PROGRESS) {
        return 10_000
      }

      if (buildStatus === BuildStatus.ERROR) {
        return 2_000
      }

      return false
    },
  })

  const buildData = data?.build
  const projectData = data?.project

  const resume = useMutation({
    mutationFn: () => resumeBuild({ projectId: projectData?.id ?? '', buildId: params.buildId }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Build resumed', { description: 'The build has been requested to resume.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BUILDS, projectData?.id] })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BUILDS, projectData?.id, params.buildId] })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SNAPSHOTS, projectData?.id, params.buildId] })
        return
      }

      toast.error('Failed to resume build', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

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
              <Link href={`/projects/${projectData.id}`}>{projectData.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${projectData.id}/builds` as Route}>Builds</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{buildData.identifier}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [projectData, buildData],
  )
  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  const navigations = useMemo<NavigationType[]>(
    () => snapshotsMenu(projectData?.id ?? '', params.buildId),
    [projectData?.id, params.buildId],
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
