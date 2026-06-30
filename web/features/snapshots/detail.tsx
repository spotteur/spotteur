'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, RotateCcw, RefreshCw, MessageSquareDot, MessageSquare, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Field } from '@/components/ui/field'
import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { BROWSER_LABEL_MAP, SNAPSHOT_VIEWER_TYPE_LABEL_MAP, SnapshotViewerType } from '@/constants/enum'
import { detailBuildQueryKey, listSnapshotsByBuildQueryKey } from '@/constants/query-keys'
import { SnapshotApprovalStatus } from '@/constants/status-map'
import { retrySingleSnapshot, type MediaDetailRes, type SnapshotDetailRes } from '@/features/snapshots/actions'
import { updateSnapshotApprovalStatus } from '@/features/snapshots/actions'
import { cn, isSnapshotExactlyMatching } from '@/lib/utils'

import { SnapshotApprovalStatusBadge, SnapshotDiffBadge } from './badge'
import { getSnapshotIcon } from './review-tree'
import { UpdateSnapshotNotesDialog } from './update-snapshot-notes-dialog'

interface SnapshotViewerProps {
  snapshot: SnapshotDetailRes
  action?: ReactNode
  isOpen: boolean
  diffTolerancePercentage: number
  bulkItems: string[]
  setBulkItems: (updater: (prev: string[]) => string[]) => void
}

export function SnapshotActionButtons({
  snapshot,
  projectId,
  buildId,
  snapshotId,
}: {
  snapshot: SnapshotDetailRes
  projectId: string
  buildId: string
  snapshotId: string
}) {
  const queryClient = useQueryClient()

  const {
    mutate: updateStatus,
    isPending,
    variables: pendingStatus,
  } = useMutation({
    mutationFn: (status: SnapshotApprovalStatus) =>
      updateSnapshotApprovalStatus({
        snapshotId,
        status,
      }),
    onSuccess: (res, status) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: detailBuildQueryKey(buildId) })
        queryClient.invalidateQueries({ queryKey: listSnapshotsByBuildQueryKey(buildId) })

        const statusMessages = {
          [SnapshotApprovalStatus.APPROVED]: 'Snapshot approved',
          [SnapshotApprovalStatus.REJECTED]: 'Snapshot rejected',
          [SnapshotApprovalStatus.PENDING]: 'Review removed',
        }

        toast.success(statusMessages[status])
        return
      }

      toast.error('Failed to update snapshot approval', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  const retrySnapshotMutation = useMutation({
    mutationFn: () =>
      retrySingleSnapshot({
        projectId,
        buildId,
        snapshotId,
      }),
    onSuccess: (res) => {
      if (res && res.ok) {
        queryClient.invalidateQueries({
          queryKey: listSnapshotsByBuildQueryKey(buildId),
        })

        toast.success('Snapshot retry triggered')
        return
      }

      toast.error('Failed to retry snapshot')
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  const isLoading = isPending || retrySnapshotMutation.isPending

  return (
    <div className="flex flex-wrap items-center gap-2">
      {snapshot.approvalStatus === SnapshotApprovalStatus.PENDING ? (
        <>
          <Button
            size="sm"
            variant="default"
            onClick={() => updateStatus(SnapshotApprovalStatus.APPROVED)}
            disabled={isLoading}
          >
            {isLoading && pendingStatus === SnapshotApprovalStatus.APPROVED ? (
              <Spinner />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Approve
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateStatus(SnapshotApprovalStatus.REJECTED)}
            disabled={isLoading}
          >
            {isLoading && pendingStatus === SnapshotApprovalStatus.REJECTED ? (
              <Spinner />
            ) : (
              <XCircle className="size-4" />
            )}
            Reject
          </Button>

          <Button size="sm" variant="outline" onClick={() => retrySnapshotMutation.mutate()} disabled={isLoading}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus(SnapshotApprovalStatus.PENDING)}
          disabled={isLoading}
        >
          {isLoading && pendingStatus === SnapshotApprovalStatus.PENDING ? (
            <Spinner />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Undo Review
        </Button>
      )}
    </div>
  )
}

const SnapshotLabel = ({ children, media }: { children: ReactNode; media?: MediaDetailRes | null }) => {
  if (!media?.path) {
    return <span>{children}</span>
  }

  return <span>{`${children} (${media?.width || 0}x${media?.height || 0})`}</span>
}

const SnapshotLabels = ({ snapshot }: { snapshot: SnapshotDetailRes }) => (
  <div className="text-muted-foreground flex justify-between text-xs">
    <SnapshotLabel media={snapshot.baselineScreenshotMedia}>Baseline</SnapshotLabel>
    <SnapshotLabel media={snapshot.screenshotMedia}>Current</SnapshotLabel>
  </div>
)

export function SnapshotViewer({
  snapshot,
  action,
  isOpen,
  diffTolerancePercentage,
  bulkItems,
  setBulkItems,
}: SnapshotViewerProps) {
  const dimensionMismatch =
    snapshot.baselineScreenshotMedia?.width !== snapshot.screenshotMedia?.width ||
    snapshot.baselineScreenshotMedia?.height !== snapshot.screenshotMedia?.height
  const noBaseline = snapshot.baselineScreenshotMedia === null
  const width = Math.max(snapshot.baselineScreenshotMedia?.width || 0, snapshot.screenshotMedia?.width || 0)
  const height = Math.max(snapshot.baselineScreenshotMedia?.height || 0, snapshot.screenshotMedia?.height || 0)
  const aspectRatio = width && height ? `${width} / ${height}` : '4 / 3'

  // If there's no baseline, heatmap & comparison view is not available, default to side-by-side to show the current screenshot.
  // If there's a dimension mismatch, heatmap view is not available, default to comparison view to show the differences.
  const defaultTab = noBaseline
    ? SnapshotViewerType.SIDE_BY_SIDE
    : dimensionMismatch
      ? SnapshotViewerType.COMPARISON
      : SnapshotViewerType.HEATMAP

  return (
    <Tabs defaultValue={defaultTab} className="space-y-2">
      <div className="sticky top-0 z-2 m-0! flex flex-col gap-2 bg-white py-2 text-left dark:bg-black">
        <div className="flex w-full justify-between gap-6">
          <div className="flex items-center gap-2">
            {getSnapshotIcon(snapshot, diffTolerancePercentage)}
            <span>{`Page path ${snapshot.pagePath} on browser ${BROWSER_LABEL_MAP[snapshot.browser]}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <UpdateSnapshotNotesDialog buildId={snapshot.buildId} snapshotId={snapshot.id} notes={snapshot.notes}>
              <Button type="button" variant="ghost" size="icon">
                {snapshot.notes ? <MessageSquareDot /> : <MessageSquare />}
              </Button>
            </UpdateSnapshotNotesDialog>
            <SnapshotApprovalStatusBadge status={snapshot.approvalStatus} />
            <SnapshotDiffBadge
              diffPercentage={snapshot.diffPercentage}
              diffTolerancePercentage={diffTolerancePercentage}
            />
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="icon">
                <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <Field orientation="horizontal">
              <Checkbox
                id="bulkUpdate"
                checked={bulkItems.includes(snapshot.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setBulkItems((prev) => [...prev, snapshot.id])
                  } else {
                    setBulkItems((prev) => prev.filter((id) => id !== snapshot.id))
                  }
                }}
                disabled={isSnapshotExactlyMatching(snapshot.diffPercentage, diffTolerancePercentage)}
              />
            </Field>
          </div>
        </div>
        <div className={cn('hidden', isOpen && 'flex justify-between')}>
          <TabsList>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block w-fit">
                  <TabsTrigger
                    disabled={noBaseline || dimensionMismatch ? true : undefined}
                    value={SnapshotViewerType.HEATMAP}
                  >
                    {SNAPSHOT_VIEWER_TYPE_LABEL_MAP[SnapshotViewerType.HEATMAP]}
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent hidden={!(dimensionMismatch || noBaseline)}>
                {noBaseline
                  ? `${SNAPSHOT_VIEWER_TYPE_LABEL_MAP[SnapshotViewerType.HEATMAP]} view is unavailable because there's no baseline screenshot to compare.`
                  : `${SNAPSHOT_VIEWER_TYPE_LABEL_MAP[SnapshotViewerType.HEATMAP]} view is unavailable due to dimension mismatch between baseline and current screenshots.`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block w-fit">
                  <TabsTrigger disabled={noBaseline ? true : undefined} value={SnapshotViewerType.COMPARISON}>
                    {SNAPSHOT_VIEWER_TYPE_LABEL_MAP[SnapshotViewerType.COMPARISON]}
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent hidden={!noBaseline}>
                {`${SNAPSHOT_VIEWER_TYPE_LABEL_MAP[SnapshotViewerType.COMPARISON]} view is unavailable because there's no baseline screenshot to compare.`}
              </TooltipContent>
            </Tooltip>
            <TabsTrigger value={SnapshotViewerType.SIDE_BY_SIDE}>
              {SNAPSHOT_VIEWER_TYPE_LABEL_MAP[SnapshotViewerType.SIDE_BY_SIDE]}
            </TabsTrigger>
          </TabsList>
          {action}
        </div>
      </div>

      <CollapsibleContent>
        <TabsContent value="comparison" className={`${!isOpen && 'm-0'}`}>
          {snapshot.baselineScreenshotMedia === null ? (
            <PreviewFallback message="This snapshot doesn't have a baseline image to compare" />
          ) : snapshot.screenshotMedia === null ? (
            <PreviewFallback message="This snapshot doesn't have any image yet" />
          ) : (
            <div className="flex w-full flex-col gap-2">
              <SnapshotLabels snapshot={snapshot} />
              <div className="bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAK0lEQVQ4y2P8//8/A25w7949PLJMDBSAUc0jQzML/jSkpKQ0GmCjminRDADJNQjBr5nbigAAAABJRU5ErkJggg==')] bg-repeat py-0">
                <Comparison style={{ aspectRatio }} mode="hover">
                  {/* Please note that the positions are reversed, the right position corresponds to the left side. */}
                  <ComparisonItem position="right">
                    <Image
                      unoptimized
                      src={snapshot.baselineScreenshotMedia.path}
                      alt="Baseline"
                      width={snapshot.baselineScreenshotMedia.width || 0}
                      height={snapshot.baselineScreenshotMedia.height || 0}
                      className="h-auto w-full"
                    />
                  </ComparisonItem>
                  <ComparisonItem position="left">
                    <Image
                      unoptimized
                      src={snapshot.screenshotMedia.path}
                      alt="Current"
                      width={snapshot.screenshotMedia.width || 0}
                      height={snapshot.screenshotMedia.height || 0}
                      className="h-auto w-full"
                    />
                  </ComparisonItem>
                  <ComparisonHandle />
                </Comparison>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="heatmap" className={`${!isOpen && 'm-0'}`}>
          <div className="w-full">
            {snapshot.diffScreenshotMedia?.path ? (
              <div className="relative w-full">
                <Image
                  unoptimized
                  src={snapshot.diffScreenshotMedia?.path}
                  width={snapshot.diffScreenshotMedia?.width || 0}
                  height={snapshot.diffScreenshotMedia?.height || 0}
                  alt="Diff heatmap"
                  className="h-auto w-full"
                />
              </div>
            ) : dimensionMismatch ? (
              <PreviewFallback message="Unable to display heatmap due to dimension mismatch" />
            ) : (
              <PreviewFallback />
            )}
          </div>
        </TabsContent>
        <TabsContent value="side-by-side" className={`${!isOpen && 'm-0'}`}>
          <div className="flex w-full flex-col gap-2">
            <SnapshotLabels snapshot={snapshot} />
            <div className="grid w-full grid-cols-2 gap-4">
              <SnapshotImage label="Baseline" media={snapshot.baselineScreenshotMedia} />
              <SnapshotImage label="Current" media={snapshot.screenshotMedia} />
            </div>
          </div>
        </TabsContent>
      </CollapsibleContent>
    </Tabs>
  )
}

const SnapshotImage = ({ label, media }: { label?: string; media?: MediaDetailRes | null }) => {
  if (!media?.path) {
    return <PreviewFallback />
  }

  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : '4 / 3'

  return (
    <div className="bg-muted/20 relative w-full overflow-hidden border-none" style={{ aspectRatio }}>
      <Image unoptimized src={media.path} alt={label ?? 'Snapshot preview'} fill className="object-contain" />
    </div>
  )
}

const PreviewFallback = ({ message }: { message?: string }) => (
  <div className="bg-muted/40 text-muted-foreground flex h-48 items-center justify-center border text-base">
    {message ?? 'No image available'}
  </div>
)
