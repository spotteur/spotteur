'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, Play } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEY_BUILDS } from '@/constants/query-keys'
import { BUILD_STATUS_COLOR_MAP, BUILD_STATUS_MAP, type BuildStatus } from '@/constants/status-map'
import { builds } from '@/db/schema'
import { listBuildsByProject, triggerBuild } from '@/features/builds/actions'
import { formatDateTime } from '@/lib/utils'

export function BuildListCard({ projectId }: { projectId?: string }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, projectId],
    queryFn: () => listBuildsByProject({ projectId: projectId!, pageSize: 50 }),
    enabled: !!projectId,
  })

  const trigger = useMutation({
    mutationFn: (projectId: string) => triggerBuild({ projectId }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Build triggered', { description: 'A new build was queued.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BUILDS, projectId] })
      } else {
        toast.error('Failed to trigger build', { description: res.error ?? 'Unknown error' })
      }
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-end gap-2 pb-0">
        {projectId ? (
          <Button onClick={() => trigger.mutate(projectId)} disabled={trigger.isPending} size="sm">
            <Play className="mr-2 size-4" /> Trigger build
          </Button>
        ) : (
          <Skeleton className="h-8 w-32" />
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {!projectId || isLoading ? (
          <BuildListSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.data?.map((build) => {
              return (
                <Link key={build.id} href={`/projects/${projectId}/builds/${build.id}/snapshots` as Route}>
                  <BuildItemCard build={build} />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BuildItemCard({ build }: { build: typeof builds.$inferSelect }) {
  return (
    <Card className="hover:border-primary h-full transition">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="word-wrap text-lg font-semibold">{build.identifier}</CardTitle>
          <Badge variant={BUILD_STATUS_COLOR_MAP[build.status as BuildStatus]} className="">
            {BUILD_STATUS_MAP[build.status as BuildStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Layers className="size-4" />
          <span>{build.pagePaths?.length ?? 0} pages</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-foreground">Created {formatDateTime(build.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function BuildListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="h-full">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-16 w-5/8" />
              <Skeleton className="h-6 w-2/8" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
