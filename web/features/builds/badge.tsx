import { Badge } from '@/components/ui/badge'
import { BUILD_STATUS_COLOR_MAP, BUILD_STATUS_MAP, type BuildStatus } from '@/constants/status-map'

export function BuildStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={BUILD_STATUS_COLOR_MAP[status as BuildStatus]}>{BUILD_STATUS_MAP[status as BuildStatus]}</Badge>
  )
}
