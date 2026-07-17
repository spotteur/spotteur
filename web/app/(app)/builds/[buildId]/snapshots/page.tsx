'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE, snapshotsMenu } from '@/constants/app'
import { detailBuildQueryKey, listBuildsByProjectQueryKey, listSnapshotsByBuildQueryKey } from '@/constants/query-keys'
import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import { getBuildDetail, resumeBuild } from '@/features/builds/actions'
import { BuildSummaryCard } from '@/features/builds/summary'
import { bulkUpdateSnapshotApprovalStatus, listSnapshotsByBuildV2 } from '@/features/snapshots/actions'
import { SnapshotReviewContent } from '@/features/snapshots/review-content'
import { SnapshotReviewFilters } from '@/features/snapshots/review-filters'
import { SnapshotReviewTree } from '@/features/snapshots/review-tree'
import { isSnapshotExactlyMatching } from '@/lib/utils'
import { type NavigationType } from '@/types/app'

export default function BuildDetailSnapshotPage() {
  const params = useParams<{ buildId: string }>()
  const [selectedPath, setSelectedPath] = useQueryState('path', parseAsString.withDefault(''))
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [browsers, setBrowsers] = useQueryState('browsers', parseAsArrayOf(parseAsString).withDefault([]))
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''))
  const [hideExactlyMatch, setHideExactlyMatch] = useQueryState('hideExactlyMatch', parseAsBoolean.withDefault(false))
  const [hideNewPage, setHideNewPage] = useQueryState('hideNewPage', parseAsBoolean.withDefault(false))
  const [bulkItems, setBulkItems] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<SnapshotApprovalStatus>(SnapshotApprovalStatus.APPROVED)

  const queryClient = useQueryClient()

  const { data, isLoading: isLoadingBuild } = useQuery({
    queryKey: detailBuildQueryKey(params.buildId),
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
  const diffTolerancePercentage = buildData?.diffTolerancePercentage ?? 0
  const projectData = data?.project

  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useQuery({
    queryKey: listSnapshotsByBuildQueryKey(params.buildId),
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
      const matchesStatusFilter = !status || snapshot.approvalStatus === status
      const matchesExactlyMatchFilter = hideExactlyMatch
        ? !isSnapshotExactlyMatching(snapshot.diffPercentage, diffTolerancePercentage)
        : true
      const matchesNewPageFilter = hideNewPage ? !!snapshot.baselineScreenshotMedia : true

      return (
        matchesSearch &&
        matchesBrowserFilter &&
        matchesStatusFilter &&
        matchesExactlyMatchFilter &&
        matchesNewPageFilter
      )
    })
  }, [snapshotsData, searchQuery, browsers, hideExactlyMatch, hideNewPage, status, diffTolerancePercentage])

  const processedItems = useMemo(() => {
    const processedPages = snapshotsData?.data.length ?? 0
    const totalPages = buildData?.expectedSnapshotCount ?? 0
    const progress = totalPages === 0 ? 0 : (processedPages / totalPages) * 100

    return progress
  }, [snapshotsData, buildData])
  const resume = useMutation({
    mutationFn: () => resumeBuild({ projectId: projectData?.id ?? '', buildId: params.buildId }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Build resumed', { description: 'The build has been requested to resume.' })
        queryClient.invalidateQueries({ queryKey: listBuildsByProjectQueryKey(projectData?.id ?? '') })
        queryClient.invalidateQueries({ queryKey: detailBuildQueryKey(params.buildId) })
        queryClient.invalidateQueries({ queryKey: listSnapshotsByBuildQueryKey(params.buildId) })
        return
      }

      toast.error('Failed to resume build', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  const { mutate: updateBulkStatus, isPending: isBulkUpdatePending } = useMutation({
    mutationFn: async (ids: string[]) =>
      bulkUpdateSnapshotApprovalStatus({
        snapshotIds: ids,
        status: bulkStatus,
      }),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: listSnapshotsByBuildQueryKey(params.buildId) })

        toast.success('Success updated selected items.')
        setBulkItems([])
      }
    },
    onError: (error) => {
      console.error(error)
      toast.error('Bulk update status failed')
    },
  })

  const selectedSnapshotId = useMemo(() => {
    if (selectedPath) {
      return snapshotItems.find((snapshot) => snapshot.pagePath === selectedPath)?.id
    }

    return snapshotItems[0]?.id
  }, [selectedPath, snapshotItems])

  const [openedSnapshotIds, setOpenedSnapshotIds] = useState<string[]>([])

  useEffect(() => {
    if (snapshotItems.length === 0) {
      return
    }

    // On first load, set selected path to the first snapshot items
    if (!selectedPath) {
      setSelectedPath(snapshotItems[0].pagePath)
    }

    // On filter change, if the selected path not in the filtered snapshot items, set selected path to the first snapshot items
    if (!snapshotItems.some((s) => s.pagePath === selectedPath)) {
      setSelectedPath(snapshotItems[0].pagePath)
    }
  }, [snapshotItems, selectedPath, setSelectedPath])

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

  const filteredSnapshotItems = snapshotItems.filter((s) => {
    const isExactlyMatch = isSnapshotExactlyMatching(s.diffPercentage, diffTolerancePercentage)
    return !isExactlyMatch && s
  })

  const onBulkSelectChange = (isSelected: boolean) => {
    if (isSelected) {
      setBulkItems(filteredSnapshotItems.map((s) => s.id))
    } else {
      setBulkItems([])
    }
  }

  const isLoading = isLoadingBuild || isLoadingSnapshots

  const onBulkActionChange = (value: SnapshotApprovalStatus) => {
    if (!value) {
      return
    }
    setBulkStatus(value)
    updateBulkStatus(bulkItems)
  }

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
            <BreadcrumbPage>{buildData.identifier}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [projectData, buildData],
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
        <Skeleton className="flex h-68 gap-3 p-2 shadow-none" />
        <Skeleton className="flex h-13.5 flex-row items-center gap-3 p-2 shadow-none" />
        <Skeleton className="min-h-screen w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-3">
      <BuildSummaryCard
        build={buildData}
        onResume={() => resume.mutate()}
        isResumePending={resume.isPending}
        progress={processedItems}
      />
      <div className="flex h-screen flex-col space-y-3">
        <div className="sticky top-0 z-4 flex flex-row items-center justify-between bg-white py-2 dark:bg-black">
          <SnapshotReviewFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            browsers={browsers}
            setBrowsers={setBrowsers}
            status={status}
            setStatus={setStatus}
            hideExactlyMatch={hideExactlyMatch}
            setHideExactlyMatch={setHideExactlyMatch}
            hideNewPage={hideNewPage}
            setHideNewPage={setHideNewPage}
            diffTolerancePercentage={diffTolerancePercentage}
          />
          <Field orientation="horizontal" className="w-xs justify-end px-4">
            <Checkbox
              id="bulkUpdate"
              checked={bulkItems.length === filteredSnapshotItems.length}
              onCheckedChange={onBulkSelectChange}
            />
          </Field>
        </div>
        <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-visible rounded-lg border">
          <ResizablePanel collapsible minSize="12%" defaultSize="20%" maxSize="35%" className="overflow-auto">
            <SnapshotReviewTree
              snapshotItems={snapshotItems}
              selectedPath={selectedPath}
              onSelectNode={(node) => setSelectedPath(node.path)}
              filterApplied={searchQuery.length > 0 || browsers.length > 0 || hideExactlyMatch || hideNewPage}
              diffTolerancePercentage={diffTolerancePercentage}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <SnapshotReviewContent
              snapshotItems={snapshotItems}
              selectedSnapshotId={selectedSnapshotId}
              openedSnapshotIds={openedSnapshotIds}
              diffTolerancePercentage={diffTolerancePercentage}
              onChangeOpenedSnapshot={onChangeOpenedSnapshot}
              projectId={projectData?.id ?? ''}
              bulkItems={bulkItems}
              setBulkItems={setBulkItems}
              onBulkActionChange={onBulkActionChange}
              isBulkUpdatePending={isBulkUpdatePending}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
