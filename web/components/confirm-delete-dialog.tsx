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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type ConfirmDeleteDialogProps = {
  open: boolean
  valueToMatch: string
  title: string
  instruction: string
  onConfirm: () => void
  onCancel: () => void
  confirmButtonText?: string
  cancelButtonText?: string
}

export function ConfirmDeleteDialog({
  open,
  valueToMatch,
  title,
  instruction,
  onConfirm,
  onCancel,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState('')

  const matches = typed === valueToMatch
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Please type <span className="font-mono font-semibold">{valueToMatch}</span> to confirm deletion.
          </DialogDescription>
        </DialogHeader>

        <Field data-invalid={isInvalid}>
          <FieldLabel htmlFor="confirm-delete-dialog">{instruction}</FieldLabel>
          <Input
            id="confirm-delete-dialog"
            name="confirm-delete-dialog"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={valueToMatch}
            aria-invalid={isInvalid}
          />
          {isInvalid ? <FieldError errors={[{ message: 'Input must exactly match the expected value.' }]} /> : null}
        </Field>

        <DialogFooter>
          <Button variant="secondary" type="button" onClick={handleClose}>
            {cancelButtonText}
          </Button>
          <Button variant="destructive" type="button" onClick={handleConfirm} disabled={!matches}>
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
