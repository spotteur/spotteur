import { Badge } from '@/components/ui/badge'
import {
  SNAPSHOT_APPROVAL_STATUS_COLOR_MAP,
  SNAPSHOT_APPROVAL_STATUS_MAP,
  SnapshotApprovalStatus,
} from '@/constants/status-map'
import { humanReadableDecimal } from '@/lib/utils'

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

export function SnapshotApprovalStatusBadge({
  status,
  className,
}: {
  status: SnapshotApprovalStatus
  className?: string
}) {
  return (
    <Badge variant={SNAPSHOT_APPROVAL_STATUS_COLOR_MAP[status]} className={className}>
      {SNAPSHOT_APPROVAL_STATUS_MAP[status]}
    </Badge>
  )
}
