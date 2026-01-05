import { VariantProps } from 'class-variance-authority'

import { badgeVariants } from '@/components/ui/badge'

export const BuildStatus = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  failed: 'failed',
} as const

export type BuildStatus = (typeof BuildStatus)[keyof typeof BuildStatus]

export const BUILD_STATUS_MAP: Record<BuildStatus, string> = {
  [BuildStatus.pending]: 'Pending',
  [BuildStatus.in_progress]: 'In Progress',
  [BuildStatus.completed]: 'Completed',
  [BuildStatus.failed]: 'Failed',
} as const

export const BUILD_STATUS_COLOR_MAP: Record<BuildStatus, VariantProps<typeof badgeVariants>['variant']> = {
  [BuildStatus.pending]: 'default',
  [BuildStatus.in_progress]: 'secondary',
  [BuildStatus.completed]: 'success',
  [BuildStatus.failed]: 'destructive',
} as const

export const SnapshotApprovalStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const

export type SnapshotApprovalStatus = (typeof SnapshotApprovalStatus)[keyof typeof SnapshotApprovalStatus]

export const SNAPSHOT_APPROVAL_STATUS_MAP: Record<SnapshotApprovalStatus, string> = {
  [SnapshotApprovalStatus.pending]: 'Pending',
  [SnapshotApprovalStatus.approved]: 'Approved',
  [SnapshotApprovalStatus.rejected]: 'Rejected',
} as const

export const SNAPSHOT_APPROVAL_STATUS_COLOR_MAP: Record<
  SnapshotApprovalStatus,
  VariantProps<typeof badgeVariants>['variant']
> = {
  [SnapshotApprovalStatus.pending]: 'default',
  [SnapshotApprovalStatus.approved]: 'success',
  [SnapshotApprovalStatus.rejected]: 'destructive',
} as const
