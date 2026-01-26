import { type BadgeVariant } from '@/components/ui/badge'

export enum BuildStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ERROR = 'error',
  WAITING_REVIEW = 'waiting_review',
  PASSED = 'passed',
  FAILED = 'failed',
}

export const BUILD_STATUS_MAP: Record<BuildStatus, string> = {
  [BuildStatus.PENDING]: 'Pending',
  [BuildStatus.IN_PROGRESS]: 'In Progress',
  [BuildStatus.ERROR]: 'System Error',
  [BuildStatus.WAITING_REVIEW]: 'Waiting Review',
  [BuildStatus.PASSED]: 'Test Passed',
  [BuildStatus.FAILED]: 'Test Failed',
}

export const BUILD_STATUS_COLOR_MAP: Record<BuildStatus, BadgeVariant> = {
  [BuildStatus.PENDING]: 'outline',
  [BuildStatus.IN_PROGRESS]: 'secondary',
  [BuildStatus.ERROR]: 'destructive',
  [BuildStatus.WAITING_REVIEW]: 'default',
  [BuildStatus.PASSED]: 'success',
  [BuildStatus.FAILED]: 'destructive',
}

export enum SnapshotApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const SNAPSHOT_APPROVAL_STATUS_MAP: Record<SnapshotApprovalStatus, string> = {
  [SnapshotApprovalStatus.PENDING]: 'Pending',
  [SnapshotApprovalStatus.APPROVED]: 'Approved',
  [SnapshotApprovalStatus.REJECTED]: 'Rejected',
} as const

export const SNAPSHOT_APPROVAL_STATUS_COLOR_MAP: Record<SnapshotApprovalStatus, BadgeVariant> = {
  [SnapshotApprovalStatus.PENDING]: 'default',
  [SnapshotApprovalStatus.APPROVED]: 'success',
  [SnapshotApprovalStatus.REJECTED]: 'destructive',
} as const

export const SNAPSHOT_APPROVAL_STATUS_OPTIONS = Object.values(SnapshotApprovalStatus).map((status) => ({
  value: status,
  label: SNAPSHOT_APPROVAL_STATUS_MAP[status],
}))
