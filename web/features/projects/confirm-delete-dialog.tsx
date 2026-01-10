'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ConfirmDeleteProjectDialog({
  open,
  projectName,
  onConfirm,
  onCancel,
}: {
  open: boolean
  projectName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')

  const matches = typed === projectName
  const isInvalid = typed.length > 0 && !matches

  const handleClose = () => {
    setTyped('')
    onCancel()
  }

  const handleConfirm = () => {
    setTyped('')
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please type <span className="font-mono font-semibold">{projectName}</span> to
            confirm deletion.
          </DialogDescription>
        </DialogHeader>

        <Field data-invalid={isInvalid}>
          <FieldLabel htmlFor="confirm-project-name">Type the project name to confirm</FieldLabel>
          <Input
            id="confirm-project-name"
            name="confirm-project-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={projectName}
            aria-invalid={isInvalid}
          />
          <FieldDescription>
            Please type <span className="font-mono font-semibold">{projectName}</span> exactly to enable deletion.
          </FieldDescription>
          {isInvalid && <FieldError errors={[{ message: 'Input must exactly match the project name.' }]} />}
        </Field>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!matches}>
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
