'use client'

import { ChevronDown, MessageSquare, MessageSquareDot } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Field } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BROWSER_LABEL_MAP } from '@/constants/enum'
import { SNAPSHOT_APPROVAL_STATUS_OPTIONS, SnapshotApprovalStatus } from '@/constants/status-map'
import { type SnapshotDetailRes } from '@/features/snapshots/actions'
import { SnapshotActionButtons, SnapshotViewer } from '@/features/snapshots/detail'
import { cn, isSnapshotExactlyMatching } from '@/lib/utils'

import { SnapshotApprovalStatusBadge, SnapshotDiffBadge } from './badge'
import { getSnapshotIcon } from './review-tree'
import { UpdateSnapshotNotesDialog } from './update-snapshot-notes-dialog'

interface SnapshotReviewContentProps {
  snapshotItems: SnapshotDetailRes[]
  projectId: string
  buildId: string
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
  buildId,
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
              <div className="flex w-full justify-between gap-6 py-2 text-left">
                <div className="flex items-center gap-2">
                  {getSnapshotIcon(snapshot, diffTolerancePercentage)}
                  <span>{`Page path ${snapshot.pagePath} on browser ${BROWSER_LABEL_MAP[snapshot.browser]}`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UpdateSnapshotNotesDialog
                    projectId={projectId}
                    buildId={buildId}
                    snapshotId={snapshot.id}
                    notes={snapshot.notes}
                  >
                    <Button type="button" variant="ghost" size="icon">
                      {snapshot.notes ? <MessageSquareDot /> : <MessageSquare />}
                    </Button>
                  </UpdateSnapshotNotesDialog>
                  <SnapshotApprovalStatusBadge status={snapshot.approvalStatus} />
                  <SnapshotDiffBadge
                    diffPercentage={snapshot.diffPercentage}
                    diffTolerancePercentage={diffTolerancePercentage}
                  />
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="bulkUpdate"
                      checked={bulkItems.includes(snapshot.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBulkItems((prev) => [...prev, snapshot.id])
                        } else {
                          setBulkItems((prev) => prev.filter((id) => id !== snapshot.id))
                        }
                      }}
                      disabled={isSnapshotExactlyMatching(snapshot.diffPercentage, diffTolerancePercentage)}
                    />
                  </Field>
                </div>
              </div>
              <CollapsibleContent className="pt-2">
                <SnapshotViewer
                  snapshot={snapshot}
                  action={
                    <SnapshotActionButtons
                      snapshot={snapshot}
                      projectId={projectId}
                      buildId={buildId}
                      snapshotId={snapshot.id}
                    />
                  }
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )
      })}
      <div
        className={cn(
          'text-muted-foreground w-full items-end justify-end bg-black! py-5 text-sm',
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
              {SNAPSHOT_APPROVAL_STATUS_OPTIONS.filter((option) => option.value !== 'pending').map(
                ({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          className="ml-4"
          disabled={bulkItems.length === 0 || isBulkUpdatePending || !bulkAction}
          onClick={() => handleBulkActionChange(bulkAction)}
        >
          Apply Selected Items
        </Button>
      </div>
    </ScrollArea>
  )
}
