'use client'

import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type MediaDetailRes, type SnapshotDetailRes } from '@/features/snapshots/actions'

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
