import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BuildStatus } from '@/constants/status-map'
import { type builds } from '@/db/schema'
import { BuildStatusBadge } from '@/features/builds/badge'
import { formatDateTime } from '@/lib/utils'

export function BuildSummaryCard({
  build,
  onResume,
  isResumePending,
}: {
  build?: typeof builds.$inferSelect | null
  onResume?: () => void
  isResumePending?: boolean
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
      <CardContent className="text-muted-foreground space-y-2 text-sm">
        {build ? (
          <>
            <div className="flex flex-wrap gap-4">
              <span className="text-foreground font-medium">Base URL:</span> {build.baseUrl}
            </div>
            <div className="flex flex-wrap gap-4">
              <span className="text-foreground font-medium">Created:</span> {formatDateTime(build.createdAt)}
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
