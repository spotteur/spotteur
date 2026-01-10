import { Badge } from '@/components/ui/badge'
import { BUILD_STATUS_COLOR_MAP, BUILD_STATUS_MAP, type BuildStatus } from '@/constants/status-map'

export function BuildStatusBadge({ status }: { status: BuildStatus }) {
  return <Badge variant={BUILD_STATUS_COLOR_MAP[status]}>{BUILD_STATUS_MAP[status]}</Badge>
}
