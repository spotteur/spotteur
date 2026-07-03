'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SnapshotApprovalStatus } from '@/constants/status-map'
import { type SnapshotDetailRes } from '@/features/snapshots/actions'
import { SnapshotActionButtons, SnapshotViewer } from '@/features/snapshots/detail'
import { cn } from '@/lib/utils'

interface SnapshotReviewContentProps {
  snapshotItems: SnapshotDetailRes[]
  projectId: string
  diffTolerancePercentage: number
  onChangeOpenedSnapshot: (snapshotId: string, open: boolean) => void
  openedSnapshotIds?: string[]
  selectedSnapshotId?: string
  bulkItems?: string[]
  setBulkItems?: (updater: (prev: string[]) => string[]) => void
  onBulkActionChange?: (value: SnapshotApprovalStatus) => void
  isBulkUpdatePending?: boolean
}

export function SnapshotReviewContent({
  snapshotItems,
  projectId,
  diffTolerancePercentage,
  onChangeOpenedSnapshot,
  openedSnapshotIds = [],
  selectedSnapshotId,
  bulkItems = [],
  setBulkItems = () => {},
  onBulkActionChange = () => {},
  isBulkUpdatePending,
}: SnapshotReviewContentProps) {
  const [bulkAction, setBulkAction] = useState<SnapshotApprovalStatus>(SnapshotApprovalStatus.APPROVED)

  useEffect(() => {
    if (!selectedSnapshotId) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      const itemElement = document.getElementById(`snapshot-${selectedSnapshotId}`)
      if (!itemElement) {
        return
      }

      const scrollViewport = itemElement.closest('[data-slot="scroll-area-viewport"]')
      if (scrollViewport) {
        // Calculate position relative to viewport and scroll to position element at top
        const itemRect = itemElement.getBoundingClientRect()
        const viewportRect = scrollViewport.getBoundingClientRect()
        const currentScroll = scrollViewport.scrollTop
        const targetScroll = currentScroll + (itemRect.top - viewportRect.top)

        scrollViewport.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }
    })

    return () => cancelAnimationFrame(frameId)
  }, [selectedSnapshotId])

  const handleBulkActionChange = (value: SnapshotApprovalStatus) => {
    onBulkActionChange(value)
  }

  return (
    <ScrollArea className="h-full">
      {snapshotItems.map((snapshot) => {
        const isOpen = openedSnapshotIds.includes(snapshot.id)

        return (
          <div key={snapshot.id} id={`snapshot-${snapshot.id}`} className="border-b px-4 last:border-b-0">
            <Collapsible open={isOpen} onOpenChange={(open) => onChangeOpenedSnapshot(snapshot.id, open)}>
              <SnapshotViewer
                snapshot={snapshot}
                isOpen={isOpen}
                diffTolerancePercentage={diffTolerancePercentage}
                bulkItems={bulkItems}
                setBulkItems={setBulkItems}
                action={
                  <SnapshotActionButtons
                    snapshot={snapshot}
                    projectId={projectId}
                    buildId={snapshot.buildId}
                    snapshotId={snapshot.id}
                  />
                }
              />
            </Collapsible>
          </div>
        )
      })}
      <div
        className={cn(
          'text-muted-foreground z-10 w-full items-end justify-end bg-white py-5 text-sm dark:bg-black!',
          bulkItems.length > 0 ? 'fixed right-7 bottom-0 flex' : 'hidden',
        )}
      >
        <Select
          defaultValue={SnapshotApprovalStatus.APPROVED}
          onValueChange={(value: SnapshotApprovalStatus) => setBulkAction(value)}
          disabled={bulkItems.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={SnapshotApprovalStatus.APPROVED}>Approve</SelectItem>
              <SelectItem value={SnapshotApprovalStatus.REJECTED}>Reject</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          className="ml-4"
          disabled={bulkItems.length === 0 || isBulkUpdatePending || !bulkAction}
          onClick={() => handleBulkActionChange(bulkAction)}
        >
          Submit Approval
        </Button>
      </div>
    </ScrollArea>
  )
}
