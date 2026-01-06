'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemTitle } from '@/components/ui/item'
import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SNAPSHOT_APPROVAL_STATUS_COLOR_MAP,
  SNAPSHOT_APPROVAL_STATUS_MAP,
  SnapshotApprovalStatus,
} from '@/constants/status-map'
import { builds } from '@/db/schema'
import { humanReadableDecimal } from '@/lib/utils'

type SnapshotMedia = {
  id: string | null
  path: string | null
  width: number | null
  height: number | null
  mimeType: string | null
}

type Build = typeof builds.$inferSelect

type Snapshot = {
  id: string
  pagePath: string
  diffPercentage: number
  approvalStatus: string
  width: number
  height: number
  screenshotMedia: SnapshotMedia | null
  baselineScreenshotMedia?: SnapshotMedia | null
  diffScreenshotMedia?: SnapshotMedia | null
}

interface SnapshotsProps {
  build: Build
  snapshots: Snapshot[]
  projectId: string
}

export function SnapshotsList({ build, snapshots, projectId }: SnapshotsProps) {
  if (!snapshots.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Snapshots</CardTitle>
          <CardDescription>No snapshots found for this build.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-muted p-4">
      <ItemGroup className="grid grid-cols-3 gap-4">
        {snapshots.map((snapshot) => (
          <SnapshotListItem key={snapshot.id} snapshot={snapshot} projectId={projectId} build={build} />
        ))}
      </ItemGroup>
    </Card>
  )
}

export function SnapshotDiffBadge({ diffPercentage, className }: { diffPercentage: number; className?: string }) {
  if (diffPercentage > 0) {
    return (
      <Badge variant="destructive" className={className}>
        Diff {humanReadableDecimal(diffPercentage)}%
      </Badge>
    )
  }

  return (
    <Badge variant="success" className={className}>
      Exactly match
    </Badge>
  )
}

export function SnapshotApprovalStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={SNAPSHOT_APPROVAL_STATUS_COLOR_MAP[status as SnapshotApprovalStatus]}>
      {SNAPSHOT_APPROVAL_STATUS_MAP[status as SnapshotApprovalStatus]}
    </Badge>
  )
}

export function SnapshotViewer({ snapshot }: { snapshot: Snapshot }) {
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

function SnapshotListItem({ snapshot, projectId, build }: { snapshot: Snapshot; projectId: string; build: Build }) {
  return (
    <Item key={snapshot.id} variant="outline" asChild>
      <Link
        href={`/projects/${projectId}/builds/${build.id}/snapshots/${snapshot.id}`}
        aria-label={`View ${snapshot.pagePath}`}
      >
        <ItemHeader>
          <div className="bg-muted/40 relative h-56 w-full shrink-0 overflow-hidden rounded-md border">
            <>
              {snapshot.screenshotMedia?.path ? (
                <Image src={snapshot.screenshotMedia.path} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                  Image not available
                </div>
              )}
              <SnapshotDiffBadge diffPercentage={snapshot.diffPercentage} className="absolute top-3 right-3" />
            </>
          </div>
        </ItemHeader>
        <ItemContent>
          <ItemTitle>Page path {snapshot.pagePath}</ItemTitle>
          <ItemDescription>Page full URL {build.baseUrl + snapshot.pagePath}</ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  )
}

const SnapshotImage = ({ label, media }: { label?: string; media?: SnapshotMedia | null }) => {
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

export function SnapshotsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-20 w-32" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
