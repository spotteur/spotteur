import { type BadgeVariant } from '@/components/ui/badge'

export enum BuildStatus {
  pending = 'pending',
  in_progress = 'in_progress',
  error = 'error',
  waiting_review = 'waiting_review',
  passed = 'passed',
  failed = 'failed',
}

export const BUILD_STATUS_MAP: Record<BuildStatus, string> = {
  [BuildStatus.pending]: 'Pending',
  [BuildStatus.in_progress]: 'In Progress',
  [BuildStatus.error]: 'System Error',
  [BuildStatus.waiting_review]: 'Waiting Review',
  [BuildStatus.passed]: 'Test Passed',
  [BuildStatus.failed]: 'Test Failed',
}

export const BUILD_STATUS_COLOR_MAP: Record<BuildStatus, BadgeVariant> = {
  [BuildStatus.pending]: 'outline',
  [BuildStatus.in_progress]: 'secondary',
  [BuildStatus.error]: 'destructive',
  [BuildStatus.waiting_review]: 'default',
  [BuildStatus.passed]: 'success',
  [BuildStatus.failed]: 'destructive',
}

export enum SnapshotApprovalStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
}

export const SNAPSHOT_APPROVAL_STATUS_MAP: Record<SnapshotApprovalStatus, string> = {
  [SnapshotApprovalStatus.pending]: 'Pending',
  [SnapshotApprovalStatus.approved]: 'Approved',
  [SnapshotApprovalStatus.rejected]: 'Rejected',
} as const

export const SNAPSHOT_APPROVAL_STATUS_COLOR_MAP: Record<SnapshotApprovalStatus, BadgeVariant> = {
  [SnapshotApprovalStatus.pending]: 'default',
  [SnapshotApprovalStatus.approved]: 'success',
  [SnapshotApprovalStatus.rejected]: 'destructive',
} as const

export const SnapshotApprovalStatusOptions = Object.values(SnapshotApprovalStatus).map((status) => ({
  value: status,
  label: SNAPSHOT_APPROVAL_STATUS_MAP[status],
}))
