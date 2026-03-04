'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { snapshotsMenu } from '@/constants/app'
import { BROWSER_LABEL_MAP } from '@/constants/enum'
import { QUERY_KEY_PROJECTS, QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { getProject } from '@/features/projects/actions'
import { getSnapshotDetail } from '@/features/snapshots/actions'
import { SnapshotApprovalStatusBadge, SnapshotDiffBadge } from '@/features/snapshots/badge'
import { SnapshotViewer, SnapshotActionButtons } from '@/features/snapshots/detail'
import { type NavigationType } from '@/types/app'

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

  const navigations = useMemo<NavigationType[]>(
    () => snapshotsMenu(params.id, params.buildId),
    [params.id, params.buildId],
  )
  useHeaderNavigations(navigations)

  if (!isLoading && (!projectData || !snapshotData)) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {snapshotData ? (
              `Page path ${snapshotData.snapshot.pagePath} on browser ${BROWSER_LABEL_MAP[snapshotData.snapshot.browser]}`
            ) : (
              <Skeleton className="h-7 w-48" />
            )}
          </CardTitle>
          <CardAction>
            {snapshotData ? (
              <SnapshotActionButtons
                snapshot={snapshotData.snapshot}
                projectId={params.id}
                buildId={params.buildId}
                snapshotId={params.snapshotId}
              />
            ) : (
              <Skeleton className="h-8 w-40" />
            )}
          </CardAction>
          <CardDescription className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              {snapshotData ? (
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
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          {snapshotData ? (
            <SnapshotViewer
              snapshot={snapshotData.snapshot}
              action={
                <div className="flex gap-5">
                  {snapshotData.action.prev ? (
                    <Button asChild variant="outline">
                      <Link
                        href={`/projects/${params.id}/builds/${params.buildId}/snapshots/${snapshotData.action.prev}`}
                      >
                        Previous
                      </Link>
                    </Button>
                  ) : null}
                  {snapshotData.action.next ? (
                    <Button asChild variant="outline">
                      <Link
                        href={`/projects/${params.id}/builds/${params.buildId}/snapshots/${snapshotData.action.next}`}
                      >
                        Next
                      </Link>
                    </Button>
                  ) : null}
                </div>
              }
            />
          ) : (
            <Skeleton className="h-150 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
