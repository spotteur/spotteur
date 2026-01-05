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
import { listBuildsByProject, triggerBuild } from '@/features/builds/actions'
import { formatDateTime } from '@/lib/utils'

interface BuildsTableProps {
  projectId: string
}

export function BuildCardsList({ projectId }: BuildsTableProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, projectId],
    queryFn: () => listBuildsByProject({ projectId, pageSize: 50 }),
  })

  const trigger = useMutation({
    mutationFn: () => triggerBuild(projectId),
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
      <CardHeader className="flex gap-2 pb-0 flex-row items-center justify-end">
        <Button onClick={() => trigger.mutate()} disabled={trigger.isPending} size="sm">
          <Play className="mr-2 h-4 w-4" /> Trigger build
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <BuildCardsSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.data?.map((build) => {
              const label = build.identifier && build.identifier.length > 0 ? build.identifier : build.id.slice(0, 8)

              return (
                <Link
                  key={build.id}
                  href={`/projects/${projectId}/builds/${build.id}/snapshots` as Route}
                  className="group"
                >
                  <Card className="h-full transition hover:border-primary">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="word-wrap text-lg font-semibold">{label}</CardTitle>
                        <Badge variant={BUILD_STATUS_COLOR_MAP[build.status as BuildStatus]} className="">
                          {BUILD_STATUS_MAP[build.status as BuildStatus]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span>{build.pagePaths?.length ?? 0} pages</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-foreground">Created {formatDateTime(build.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BuildCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="h-full">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-5 w-1/5" />
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
