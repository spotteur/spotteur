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

export function ConfirmDeletePageRuletDialog({
  open,
  pathRule,
  onConfirm,
  onCancel,
}: {
  open: boolean
  pathRule: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  const matches = typed === pathRule

  return (
    <Dialog open={open}>
      <DialogContent onPointerDownOutside={onCancel} onEscapeKeyDown={onCancel}>
        <DialogHeader>
          <DialogTitle>Delete rule</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please type <span className="font-mono font-semibold">{pathRule}</span> to
            confirm deletion.
          </DialogDescription>
        </DialogHeader>
        {(() => {
          const isInvalid = typed.length > 0 && !matches
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="confirm-rule-path">Type the path rule to confirm</FieldLabel>
              <Input
                id="confirm-path-rule"
                name="confirm-path-rule"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={pathRule}
                aria-invalid={isInvalid}
              />
              <FieldDescription>
                Please type <span className="font-mono font-semibold">{pathRule}</span> exactly to enable deletion.
              </FieldDescription>
              {isInvalid && <FieldError errors={[{ message: 'Input must exactly match the path rule.' }]} />}
            </Field>
          )
        })()}
        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" type="button" onClick={onConfirm} disabled={!matches}>
            Delete Page Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
