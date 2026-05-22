'use client'

import { useQuery } from '@tanstack/react-query'
import { type Route } from 'next'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { snapshotsMenu } from '@/constants/app'
import { QUERY_KEY_BUILDS } from '@/constants/query-keys'
import { getBuildDetail } from '@/features/builds/actions'
import { BuildSummaryCard } from '@/features/builds/summary'
import BuildListLog from '@/features/logs/list'
import { type NavigationType } from '@/types/app'

export default function BuildDetailLogsPage() {
  const params = useParams<{ buildId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, params.buildId],
    queryFn: () => getBuildDetail({ buildId: params.buildId }),
  })

  const buildData = data?.build
  const projectData = data?.project

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
            <BreadcrumbLink asChild>
              <Link href={`/builds/${params.buildId}/snapshots` as Route}>{buildData.identifier}</Link>
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
    () => snapshotsMenu(projectData?.id ?? '', params.buildId),
    [projectData?.id, params.buildId],
  )
  useHeaderNavigations(navigations)

  if (!isLoading && !buildData) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <BuildSummaryCard build={buildData} />

      <Card>
        <CardContent>
          <BuildListLog buildId={params.buildId} />
        </CardContent>
      </Card>
    </div>
  )
}
