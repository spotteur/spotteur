import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Pencil, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { ExpandableText } from '@/components/expandable-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_ERROR_MESSAGE, DEFAULT_ERROR_DESCRIPTION } from '@/constants/app'
import { detailBuildQueryKey, listBuildsByProjectQueryKey, listSnapshotsByBuildQueryKey } from '@/constants/query-keys'
import { BuildStatus } from '@/constants/status-map'
import { BuildStatusBadge } from '@/features/builds/badge'
import { UpdateBuildNotesDialog } from '@/features/builds/edit-build-notes-dialog'
import { formatDateTime, humanReadableDecimal } from '@/lib/utils'

import { getBuildDetail, resumeBuild } from './actions'
import { listSnapshotsByBuildV2 } from '../snapshots/actions'

export function BuildSummaryCard({ buildId }: { buildId: string }) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: detailBuildQueryKey(buildId),
    queryFn: () => getBuildDetail({ buildId }),
    refetchInterval: ({ state }) => {
      const buildStatus = state.data?.build?.status
      if (buildStatus === BuildStatus.PENDING || buildStatus === BuildStatus.IN_PROGRESS) {
        return 10_000
      }

      if (buildStatus === BuildStatus.ERROR) {
        return 2_000
      }

      return false
    },
  })

  const project = data?.project
  const build = data?.build

  const { data: snapshotsData } = useQuery({
    queryKey: listSnapshotsByBuildQueryKey(buildId),
    queryFn: () => listSnapshotsByBuildV2({ buildId }),
    placeholderData: (prev) => prev,
    refetchInterval: () => {
      if (build?.status === BuildStatus.PENDING || build?.status === BuildStatus.IN_PROGRESS) {
        return 10_000
      }

      return false
    },
  })

  const processedSnapshots = useMemo(() => {
    const expectedSnapshotCount = build?.expectedSnapshotCount ?? 0
    const currentSnapshotCount = snapshotsData?.data.length ?? 0

    return expectedSnapshotCount === 0 ? 0 : (currentSnapshotCount / expectedSnapshotCount) * 100
  }, [snapshotsData, build])

  const { mutate: onResume, isPending: isResumePending } = useMutation({
    mutationFn: () => resumeBuild({ projectId: project?.id ?? '', buildId }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Build resumed', { description: 'The build has been requested to resume.' })
        queryClient.invalidateQueries({ queryKey: listBuildsByProjectQueryKey(project?.id ?? '') })
        queryClient.invalidateQueries({ queryKey: detailBuildQueryKey(buildId) })
        queryClient.invalidateQueries({ queryKey: listSnapshotsByBuildQueryKey(buildId) })
        return
      }

      toast.error('Failed to resume build', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Card className="w-full sm:w-3/5">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {build ? (
            <>
              <CardTitle className="text-xl">{build.identifier}</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                {build.status === BuildStatus.ERROR ? (
                  <Button size="sm" onClick={() => onResume()} disabled={isResumePending}>
                    <RotateCcw className="size-4" />
                    Resume build
                  </Button>
                ) : null}
                <BuildStatusBadge status={build.status} />
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-5 w-20" />
            </>
          )}
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4 text-sm">
          {build ? (
            <>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  <span className="text-foreground font-medium">Base URL:</span> {build.baseUrl}
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="text-foreground font-medium">Created:</span> {formatDateTime(build.createdAt)}
                </div>
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-52" />
            </>
          )}
          <div className="flex flex-row items-center gap-3">
            <Progress value={processedSnapshots} />
            <span>{humanReadableDecimal(processedSnapshots)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full sm:w-2/5">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Notes</CardTitle>
          {build ? (
            <UpdateBuildNotesDialog buildId={build.id} notes={build.notes}>
              <Button size="icon-sm" variant="ghost">
                {build.notes ? <Pencil /> : <Plus />}
              </Button>
            </UpdateBuildNotesDialog>
          ) : (
            <Skeleton className="h-8 w-8" />
          )}
        </CardHeader>
        <CardContent className="text-sm">
          {build ? (
            build.notes ? (
              <ExpandableText text={build.notes} />
            ) : (
              <div className="text-muted-foreground text-center italic">No notes added yet.</div>
            )
          ) : (
            <Skeleton className="h-4 w-52" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
