import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { builds } from '@/db/schema'
import { BuildStatusBadge } from '@/features/builds/badge'
import { formatDateTime } from '@/lib/utils'

export function BuildSummaryCard({ build }: { build?: typeof builds.$inferSelect | null }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {build ? (
          <>
            <CardTitle className="text-xl">{build.identifier}</CardTitle>
            <BuildStatusBadge status={build.status} />
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
