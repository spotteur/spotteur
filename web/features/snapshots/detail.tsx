'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { SnapshotApprovalStatus } from '@/constants/status-map'
import { type MediaDetailRes, type SnapshotDetailRes } from '@/features/snapshots/actions'
import { updateSnapshotApprovalStatus } from '@/features/snapshots/actions'

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
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY_SNAPSHOTS, projectId, buildId, snapshotId],
        })

        const statusMessages = {
          [SnapshotApprovalStatus.approved]: 'Snapshot approved',
          [SnapshotApprovalStatus.rejected]: 'Snapshot rejected',
          [SnapshotApprovalStatus.pending]: 'Review removed',
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {snapshot.approvalStatus === SnapshotApprovalStatus.pending ? (
        <>
          <Button
            size="sm"
            variant="default"
            onClick={() => updateStatus(SnapshotApprovalStatus.approved)}
            disabled={isPending}
          >
            {isPending && pendingStatus === SnapshotApprovalStatus.approved ? (
              <Spinner />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Approve
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateStatus(SnapshotApprovalStatus.rejected)}
            disabled={isPending}
          >
            {isPending && pendingStatus === SnapshotApprovalStatus.rejected ? (
              <Spinner />
            ) : (
              <XCircle className="size-4" />
            )}
            Reject
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus(SnapshotApprovalStatus.pending)}
          disabled={isPending}
        >
          {isPending && pendingStatus === SnapshotApprovalStatus.pending ? (
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

export function SnapshotViewer({ snapshot }: { snapshot: SnapshotDetailRes }) {
  return (
    <Tabs defaultValue="comparison" className="space-y-2">
      <TabsList>
        <TabsTrigger value="comparison">Comparison</TabsTrigger>
        <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        <TabsTrigger value="side-by-side">Side by side</TabsTrigger>
      </TabsList>

      <TabsContent value="comparison">
        {snapshot.baselineScreenshotMedia?.path && snapshot.screenshotMedia?.path ? (
          <Card className="bg-muted/40 py-0">
            <Comparison className="aspect-video" mode="hover">
              {/* Please note that the positions are reversed, the right position corresponds to the left side. */}
              <ComparisonItem position="right">
                <Image
                  src={snapshot.baselineScreenshotMedia.path}
                  alt="Baseline"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </ComparisonItem>
              <ComparisonItem position="left">
                <Image src={snapshot.screenshotMedia.path} alt="Current" fill className="object-contain" unoptimized />
              </ComparisonItem>
              <ComparisonHandle />
              <Badge variant="outline" className="pointer-events-none absolute top-6 left-6">
                Baseline
              </Badge>
              <Badge variant="outline" className="pointer-events-none absolute top-6 right-6">
                Current
              </Badge>
            </Comparison>
          </Card>
        ) : (
          <PreviewFallback message="Baseline or current image is missing." />
        )}
      </TabsContent>
      <TabsContent value="heatmap">
        <div className="w-full">
          {snapshot.diffScreenshotMedia?.path ? (
            <div className="relative h-1280 w-full">
              <Image
                src={snapshot.diffScreenshotMedia?.path}
                alt="Diff heatmap"
                fill
                className="object-contain object-top"
                unoptimized
              />
            </div>
          ) : (
            <PreviewFallback label="Diff heatmap" />
          )}
        </div>
      </TabsContent>
      <TabsContent value="side-by-side">
        <div className="grid w-full grid-cols-2 gap-4">
          <SnapshotImage label="Baseline" media={snapshot.baselineScreenshotMedia} />
          <SnapshotImage label="Current" media={snapshot.screenshotMedia} />
        </div>
      </TabsContent>
    </Tabs>
  )
}

const SnapshotImage = ({ label, media }: { label?: string; media?: MediaDetailRes | null }) => {
  if (!media?.path) {
    return <PreviewFallback label={label} />
  }

  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : '4 / 3'

  return (
    <div className="flex w-full flex-col gap-2">
      {label ? <span className="text-muted-foreground text-xs">{label}</span> : null}
      <div className="bg-muted/20 relative w-full overflow-hidden rounded-lg border" style={{ aspectRatio }}>
        <Image src={media.path} alt={label ?? 'Snapshot preview'} fill className="object-contain" unoptimized />
      </div>
    </div>
  )
}

const PreviewFallback = ({ label, message }: { label?: string; message?: string }) => (
  <div className="flex flex-col gap-2">
    {label ? <span className="text-muted-foreground text-xs">{label}</span> : null}
    <div className="bg-muted/40 text-muted-foreground flex h-48 items-center justify-center rounded-lg border text-xs">
      {message ?? 'No image available'}
    </div>
  </div>
)
