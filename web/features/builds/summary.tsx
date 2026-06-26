import { RotateCcw, Pencil, Plus } from 'lucide-react'

import { ExpandableText } from '@/components/expandable-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BuildStatus } from '@/constants/status-map'
import { type builds } from '@/db/schema'
import { BuildStatusBadge } from '@/features/builds/badge'
import { UpdateBuildNotesDialog } from '@/features/builds/edit-build-notes-dialog'
import { formatDateTime } from '@/lib/utils'

export function BuildSummaryCard({
  build,
  onResume,
  isResumePending,
  progress,
}: {
  build?: typeof builds.$inferSelect | null
  onResume?: () => void
  isResumePending?: boolean
  progress?: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {build ? (
          <>
            <CardTitle className="text-xl">{build.identifier}</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              {build.status === BuildStatus.ERROR && onResume ? (
                <Button size="sm" onClick={onResume} disabled={isResumePending}>
                  <RotateCcw className="size-4" />
                  Resume build
                </Button>
              ) : null}
              <BuildStatusBadge status={build.status} />
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-6 w-56 py-4.5" />
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

            <div className="bg-muted/30 relative flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex flex-row items-center gap-5">
                <span className="text-foreground font-medium">Progress:</span>
                <Field className="flex w-1/2 flex-1 flex-row items-center">
                  <Progress value={progress ?? 0} />
                  <FieldLabel>{progress?.toFixed(2)}%</FieldLabel>
                </Field>
              </div>
            </div>

            <div className="bg-muted/30 relative flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Notes</span>
                <UpdateBuildNotesDialog buildId={build.id} notes={build.notes}>
                  <Button variant="ghost" size="icon-xs">
                    {build.notes ? <Pencil /> : <Plus />}
                  </Button>
                </UpdateBuildNotesDialog>
              </div>

              {build.notes ? (
                <ExpandableText text={build.notes} />
              ) : (
                <div className="text-muted-foreground italic">No notes added yet.</div>
              )}
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-4 w-52" />
          </>
        )}
      </CardContent>
    </Card>
  )
}
