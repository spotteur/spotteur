'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { snapshotsMenu } from '@/constants/app'
import { QUERY_KEY_BUILDS, QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { BuildStatus } from '@/constants/status-map'
import { getBuildDetail } from '@/features/builds/actions'
import { listSnapshotsByBuildV2 } from '@/features/snapshots/actions'
import { SnapshotReviewContent } from '@/features/snapshots/review-content'
import { SnapshotReviewFilters } from '@/features/snapshots/review-filters'
import { SnapshotReviewTree } from '@/features/snapshots/review-tree'
import { type NavigationType } from '@/types/app'

export default function SnapshotReviewPage() {
  const params = useParams<{ buildId: string }>()
  const [selectedPath, setSelectedPath] = useQueryState('path', parseAsString.withDefault(''))
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [browsers, setBrowsers] = useQueryState('browsers', parseAsArrayOf(parseAsString).withDefault([]))
  const [hideExactlyMatch, setHideExactlyMatch] = useQueryState('hideExactlyMatch', parseAsBoolean.withDefault(false))
  const [hideNewPage, setHideNewPage] = useQueryState('hideNewPage', parseAsBoolean.withDefault(false))

  const { data, isLoading: isLoadingBuild } = useQuery({
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

  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useQuery({
    queryKey: [QUERY_KEY_SNAPSHOTS, params.buildId, 'review-tree'],
    queryFn: () => listSnapshotsByBuildV2({ buildId: params.buildId }),
    placeholderData: (prev) => prev,
    enabled: !!params.buildId,
    refetchInterval: () => {
      const buildStatus = buildData?.status
      if (buildStatus === BuildStatus.PENDING || buildStatus === BuildStatus.IN_PROGRESS) {
        return 10_000
      }

      return false
    },
  })

  const snapshotItems = useMemo(() => {
    return (snapshotsData?.data ?? []).filter((snapshot) => {
      const matchesSearch = snapshot.pagePath.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesBrowserFilter = browsers.length === 0 || browsers.includes(snapshot.browser)
      const matchesExactlyMatchFilter = hideExactlyMatch ? snapshot.diffPercentage !== 0 : true
      const matchesNewPageFilter = hideNewPage ? !!snapshot.baselineScreenshotMedia : true

      return matchesSearch && matchesBrowserFilter && matchesExactlyMatchFilter && matchesNewPageFilter
    })
  }, [snapshotsData, searchQuery, browsers, hideExactlyMatch, hideNewPage])

  const selectedSnapshotId = useMemo(() => {
    if (selectedPath) {
      return snapshotItems.find((snapshot) => snapshot.pagePath === selectedPath)?.id
    }

    return snapshotItems[0]?.id
  }, [selectedPath, snapshotItems])

  const [openedSnapshotIds, setOpenedSnapshotIds] = useState<string[]>([])

  useEffect(() => {
    if (!selectedPath && snapshotItems.length > 0) {
      setSelectedPath(snapshotItems[0].pagePath)
    }
  }, [selectedPath, snapshotItems, setSelectedPath])

  useEffect(() => {
    if (!selectedSnapshotId) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenedSnapshotIds((prev) => (prev.includes(selectedSnapshotId) ? prev : [...prev, selectedSnapshotId]))
  }, [selectedSnapshotId])

  const onChangeOpenedSnapshot = (snapshotId: string, open: boolean) => {
    setOpenedSnapshotIds((prev) => {
      if (open) {
        return prev.includes(snapshotId) ? prev : [...prev, snapshotId]
      }

      return prev.filter((id) => id !== snapshotId)
    })

    if (!open) {
      return
    }
    const snapshot = snapshotItems.find((s) => s.id === snapshotId)
    if (snapshot) {
      setSelectedPath(snapshot.pagePath)
    }
  }

  const isLoading = isLoadingBuild || isLoadingSnapshots

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
              <Link href={`/projects/${projectData.id}/builds`}>Builds</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/builds/${params.buildId}/snapshots`}>{buildData.identifier}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Review Changes</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [projectData, buildData, params.buildId],
  )
  useHeaderBreadcrumbs(breadcrumbs, isLoadingBuild)

  const navigations = useMemo<NavigationType[]>(
    () => snapshotsMenu(projectData?.id ?? '', params.buildId),
    [projectData?.id, params.buildId],
  )
  useHeaderNavigations(navigations)

  if (!isLoading && (!projectData || !buildData)) {
    notFound()
  }

  if (isLoadingSnapshots) {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="flex h-13.5 flex-row items-center gap-3 p-2 shadow-none" />
        <Skeleton className="min-h-screen w-full" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-148px)] flex-col space-y-3">
      <SnapshotReviewFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        browsers={browsers}
        setBrowsers={setBrowsers}
        hideExactlyMatch={hideExactlyMatch}
        setHideExactlyMatch={setHideExactlyMatch}
        hideNewPage={hideNewPage}
        setHideNewPage={setHideNewPage}
      />
      <ResizablePanelGroup orientation="horizontal" className="flex-1 rounded-lg border">
        <ResizablePanel collapsible minSize="12%" defaultSize="20%" maxSize="35%" className="overflow-auto">
          <SnapshotReviewTree
            snapshotItems={snapshotItems}
            selectedPath={selectedPath}
            onSelectNode={(node) => setSelectedPath(node.path)}
            filterApplied={searchQuery.length > 0 || browsers.length > 0 || hideExactlyMatch || hideNewPage}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="overflow-hidden">
          <SnapshotReviewContent
            snapshotItems={snapshotItems}
            selectedSnapshotId={selectedSnapshotId}
            openedSnapshotIds={openedSnapshotIds}
            onChangeOpenedSnapshot={onChangeOpenedSnapshot}
            projectId={projectData?.id ?? ''}
            buildId={params.buildId}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
