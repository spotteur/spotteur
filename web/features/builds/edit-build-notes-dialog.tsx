'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { QUERY_KEY_BUILDS } from '@/constants/query-keys'

import { updateBuildNotes } from './actions'
import { UpdateBuildNotesForm } from './form'
import { type UpdateBuildNotesInput } from './schema'

export function UpdateBuildNotesDialog({
  projectId,
  buildId,
  notes,
  children,
}: {
  projectId: string
  buildId: string
  children: ReactNode
  notes?: string | null
}) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const editBuildNotesMutation = useMutation({
    mutationFn: (payload: UpdateBuildNotesInput) =>
      updateBuildNotes({
        buildId,
        payload,
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Build notes successfully updated')
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BUILDS, projectId, buildId] })
        setIsDialogOpen(false)
        return
      }

      toast.error('Failed to update build notes', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Build notes</DialogTitle>
            <DialogDescription>
              Add your notes about this build here. It can be anything you want to remember or share about this build.
            </DialogDescription>
          </DialogHeader>
          <UpdateBuildNotesForm
            defaultValues={{
              notes,
            }}
            onSubmit={(values) => editBuildNotesMutation.mutate(values)}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={editBuildNotesMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
