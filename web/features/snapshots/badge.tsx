import { Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  SNAPSHOT_APPROVAL_STATUS_COLOR_MAP,
  SNAPSHOT_APPROVAL_STATUS_MAP,
  type SnapshotApprovalStatus,
} from '@/constants/status-map'
import { humanReadableDecimal, isSnapshotExactlyMatching } from '@/lib/utils'

export function SnapshotDiffBadge({
  diffPercentage,
  diffTolerancePercentage = 0,
  className,
}: {
  diffPercentage: number
  diffTolerancePercentage?: number
  className?: string
}) {
  if (!isSnapshotExactlyMatching(diffPercentage, diffTolerancePercentage)) {
    return (
      <Badge variant="destructive" className={className}>
        <div className="flex items-center space-x-1.5">
          <span>Diff {humanReadableDecimal(diffPercentage)}%</span>
          <Popover>
            <PopoverTrigger asChild>
              <Info className="size-4" />
            </PopoverTrigger>
            <PopoverContent className="w-fit px-2 py-1.5 text-xs">
              Diff {diffPercentage}% is above tolerance {diffTolerancePercentage}%
            </PopoverContent>
          </Popover>
        </div>
      </Badge>
    )
  }

  return (
    <Badge variant="success" className={className}>
      <div className="flex items-center space-x-1.5">
        <span>Exactly match</span>
        <Popover>
          <PopoverTrigger asChild>
            <Info className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-fit px-2 py-1.5 text-xs">
            Diff {diffPercentage}% is within tolerance {diffTolerancePercentage}%
          </PopoverContent>
        </Popover>
      </div>
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
