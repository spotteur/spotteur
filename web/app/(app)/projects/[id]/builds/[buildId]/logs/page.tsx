'use client'

import { useQuery } from '@tanstack/react-query'
import { type Route } from 'next'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEY_BUILDS, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { BUILD_STATUS_MAP, type BuildStatus } from '@/constants/status-map'
import { getBuildDetail } from '@/features/builds/actions'
import { getProject } from '@/features/projects/actions'
import { formatDateTime } from '@/lib/utils'

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
                {buildData.build.identifier}
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>

        <Card></Card>
      </div>
    )
  }

  if (!buildData) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">{buildData.build.identifier}</CardTitle>
          </div>
          <span className="bg-muted rounded-full px-3 py-1 text-xs font-medium capitalize">
            {BUILD_STATUS_MAP[buildData.build.status as BuildStatus]}
          </span>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <div className="flex flex-wrap gap-4">
            <span className="text-foreground font-medium">Base URL:</span> {buildData.build.baseUrl}
          </div>
          <div className="flex flex-wrap gap-4">
            <span className="text-foreground font-medium">Created:</span> {formatDateTime(buildData.build.createdAt)}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 border-b">
        <Button variant="ghost" asChild className="rounded-none border-b-2 border-transparent">
          <Link href={`/projects/${params.id}/builds/${params.buildId}/snapshots` as Route}>Snapshots</Link>
        </Button>
        <Button variant="ghost" asChild className="border-primary rounded-none border-b-2">
          <Link href={`/projects/${params.id}/builds/${params.buildId}/logs` as Route}>Logs</Link>
        </Button>
      </div>

      <Card></Card>
    </div>
  )
}
