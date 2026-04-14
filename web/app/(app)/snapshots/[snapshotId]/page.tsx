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
import { QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { getSnapshotDetail } from '@/features/snapshots/actions'
import { SnapshotApprovalStatusBadge, SnapshotDiffBadge } from '@/features/snapshots/badge'
import { SnapshotViewer, SnapshotActionButtons } from '@/features/snapshots/detail'
import { type NavigationType } from '@/types/app'

export default function SnapshotDetailPage() {
  const params = useParams<{ snapshotId: string }>()

  const { data: snapshotData, isLoading } = useQuery({
    queryKey: [QUERY_KEY_SNAPSHOTS, params.snapshotId],
    queryFn: () => getSnapshotDetail({ snapshotId: params.snapshotId }),
  })

  const projectData = snapshotData?.project
  const buildData = snapshotData?.build

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
              <Link href={`/projects/${projectData.id}`}>{projectData.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${projectData.id}/builds`}>Builds</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/builds/${buildData?.id}/snapshots`}>{snapshotData.build.identifier}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Page path {snapshotData.snapshot.pagePath}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [projectData, snapshotData, buildData],
  )

  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  const navigations = useMemo<NavigationType[]>(
    () => snapshotsMenu(projectData?.id ?? '', buildData?.id ?? ''),
    [projectData?.id, buildData?.id],
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
                projectId={projectData?.id ?? ''}
                buildId={buildData?.id ?? ''}
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
                      <Link href={`/snapshots/${snapshotData.action.prev}`}>Previous</Link>
                    </Button>
                  ) : null}
                  {snapshotData.action.next ? (
                    <Button asChild variant="outline">
                      <Link href={`/snapshots/${snapshotData.action.next}`}>Next</Link>
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
