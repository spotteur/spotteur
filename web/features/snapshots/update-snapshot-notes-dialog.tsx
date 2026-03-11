'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'

import { updateSnapshotNotes } from './actions'
import { type UpdateSnapshotNotesInput } from './schema'
import { UpdateSnapshotNotesForm } from './update-snapshot-notes-form'

export function UpdateSnapshotNotesDialog({
  projectId,
  buildId,
  snapshotId,
  notes,
  children,
}: {
  projectId: string
  buildId: string
  snapshotId: string
  children: ReactNode
  notes?: string | null
}) {
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<UpdateSnapshotNotesInput> | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const updateSnapshotNotesMutation = useMutation({
    mutationFn: (payload: UpdateSnapshotNotesInput) =>
      updateSnapshotNotes({
        snapshotId,
        payload,
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Snapshot notes successfully updated')
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SNAPSHOTS, projectId, buildId, snapshotId] })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SNAPSHOTS, projectId, buildId, 'review-tree'] })
        setIsDialogOpen(false)
        return
      }

      if (res.errors) {
        setFormErrors(res.errors)
        return
      }

      throw new Error(res.error)
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>Snapshot notes</DialogTitle>
          <DialogDescription>Write down any notes or comments about this snapshot.</DialogDescription>
        </DialogHeader>
        <UpdateSnapshotNotesForm
          defaultValues={{
            notes,
          }}
          onSubmit={(values) => updateSnapshotNotesMutation.mutate(values)}
          onCancel={() => setIsDialogOpen(false)}
          isSubmitting={updateSnapshotNotesMutation.isPending}
          errors={formErrors}
        />
      </DialogContent>
    </Dialog>
  )
}
