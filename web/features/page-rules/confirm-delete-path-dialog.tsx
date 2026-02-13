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

export function ConfirmDeletePageDialog({
  open,
  pagePath,
  onConfirm,
  onCancel,
}: {
  open: boolean
  pagePath: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  const matches = typed === pagePath

  return (
    <Dialog open={open}>
      <DialogContent onPointerDownOutside={onCancel} onEscapeKeyDown={onCancel}>
        <DialogHeader>
          <DialogTitle>Delete Page</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please type <span className="font-mono font-semibold">{pagePath}</span> to
            confirm deletion.
          </DialogDescription>
        </DialogHeader>
        {(() => {
          const isInvalid = typed.length > 0 && !matches
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="confirm-path">Type the page path to confirm</FieldLabel>
              <Input
                id="confirm-path"
                name="confirm-path"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={pagePath}
                aria-invalid={isInvalid}
              />
              <FieldDescription>
                Please type <span className="font-mono font-semibold">{pagePath}</span> exactly to enable deletion.
              </FieldDescription>
              {isInvalid && <FieldError errors={[{ message: 'Input must exactly match the page path.' }]} />}
            </Field>
          )
        })()}
        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" type="button" onClick={onConfirm} disabled={!matches}>
            Delete Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
