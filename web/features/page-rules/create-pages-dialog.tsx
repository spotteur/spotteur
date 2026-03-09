'use client'

import { type z } from 'zod'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { CreatePageRuleForm } from './form'
import { type CreatePageRuleFormInput } from './schema'

type AddPagesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (value: CreatePageRuleFormInput) => void
  isSubmitting: boolean
  errors?: z.core.$ZodFlattenedError<CreatePageRuleFormInput>
}

export function CreatePagesDialog({ open, onOpenChange, onSubmit, isSubmitting, errors }: AddPagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add new page</DialogTitle>
          <DialogDescription>
            Enter one page path per line. If a page path already exists, it will be ignored.
          </DialogDescription>
        </DialogHeader>
        <CreatePageRuleForm
          defaultValues={{
            pagePaths: '',
          }}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            onSubmit(values)
          }}
          isSubmitting={isSubmitting}
          errors={errors}
        />
      </DialogContent>
    </Dialog>
  )
}
