'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEY_PROJECTS, QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { getSnapshotDetail } from '@/features/builds/actions'
import { SnapshotApprovalStatusBadge, SnapshotDiffBadge, SnapshotViewer } from '@/features/builds/snapshots'
import { getProject } from '@/features/projects/actions'

export default function SnapshotDetailPage() {
  const params = useParams<{ id: string; buildId: string; snapshotId: string }>()

  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const { data: snapshotData, isLoading: isLoadingSnapshot } = useQuery({
    queryKey: [QUERY_KEY_SNAPSHOTS, params.id, params.buildId, params.snapshotId],
    queryFn: () => getSnapshotDetail({ projectId: params.id, buildId: params.buildId, snapshotId: params.snapshotId }),
  })

  const isLoading = isLoadingProject || isLoadingSnapshot

  const breadcrumbs = useMemo(
    () =>
      projectData && snapshotData ? (
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
              <Link href={`/projects/${params.id}/builds`}>Builds</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}/builds/${params.buildId}/snapshots`}>
                {snapshotData.build.identifier}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}/builds/${params.buildId}/snapshots`}>Snapshots</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Page path {snapshotData.snapshot.pagePath}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [projectData, snapshotData, params.id, params.buildId],
  )

  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  if (!isLoading && (!projectData || !snapshotData)) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {!isLoading && snapshotData ? (
              `Page path ${snapshotData.snapshot.pagePath}`
            ) : (
              <Skeleton className="h-6 w-48" />
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs">
            {!isLoading && snapshotData ? (
              <>
                <SnapshotApprovalStatusBadge status={snapshotData.snapshot.approvalStatus} />
                <SnapshotDiffBadge diffPercentage={snapshotData.snapshot.diffPercentage} />
              </>
            ) : (
              <>
                <Skeleton className="h-5.5 w-18" />
                <Skeleton className="h-5.5 w-18" />
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>{snapshotData && <SnapshotViewer snapshot={snapshotData.snapshot} />}</CardContent>
      </Card>
    </div>
  )
}
