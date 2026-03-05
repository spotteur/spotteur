'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BROWSER_LABEL_MAP } from '@/constants/enum'
import { type SnapshotDetailRes } from '@/features/snapshots/actions'
import { SnapshotActionButtons, SnapshotViewer } from '@/features/snapshots/detail'

import { SnapshotApprovalStatusBadge } from './badge'
import { getSnapshotIcon } from './review-tree'

interface SnapshotReviewContentProps {
  snapshotItems: SnapshotDetailRes[]
  projectId: string
  buildId: string
  onChangeOpenedSnapshot: (snapshotId: string) => void
  openedSnapshotId?: string
}

export function SnapshotReviewContent({
  snapshotItems,
  projectId,
  buildId,
  onChangeOpenedSnapshot,
  openedSnapshotId,
}: SnapshotReviewContentProps) {
  return (
    <ScrollArea type="always">
      <Accordion
        className="border"
        type="single"
        collapsible
        value={openedSnapshotId}
        onValueChange={onChangeOpenedSnapshot}
      >
        {snapshotItems.map((snapshot) => (
          <AccordionItem
            key={snapshot.id}
            value={snapshot.id}
            id={snapshot.id}
            className="border-b px-4 last:border-b-0"
          >
            <AccordionTrigger className="cursor-pointer hover:no-underline">
              <div className="flex w-full justify-between gap-6">
                <div className="flex items-center gap-2">
                  {getSnapshotIcon(snapshot)}
                  <span className="hover:underline">{`Page path ${snapshot.pagePath} on browser ${BROWSER_LABEL_MAP[snapshot.browser]}`}</span>
                </div>
                <div>
                  <SnapshotApprovalStatusBadge status={snapshot.approvalStatus} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  )
}
