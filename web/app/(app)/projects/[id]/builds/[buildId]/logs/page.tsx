'use client'

import { useQuery } from '@tanstack/react-query'
import { type Route } from 'next'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { snapshotsMenu } from '@/constants/app'
import { QUERY_KEY_BUILDS, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { getBuildDetail } from '@/features/builds/actions'
import { BuildSummaryCard } from '@/features/builds/summary'
import { getProject } from '@/features/projects/actions'
import { NavigationType } from '@/lib/type/app'

export default function BuildDetailLogsPage() {
  const params = useParams<{ id: string; buildId: string }>()

  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const { data: buildData, isLoading: isLoadingBuild } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, params.id, params.buildId],
    queryFn: () => getBuildDetail({ projectId: params.id, buildId: params.buildId }),
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
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}/builds/${params.buildId}/snapshots` as Route}>
                {buildData.identifier}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Logs</BreadcrumbPage>
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
      <BuildSummaryCard build={buildData} />

      <Card>
        <CardContent>
          <CardDescription>Coming soon...</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
