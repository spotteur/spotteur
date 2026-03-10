'use client'

import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import { type z } from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { setFormErrors } from '@/lib/utils'

import { type UpdateSnapshotNotesInput, UpdateSnapshotNotesSchema } from './schema'

interface UpdateSnapshotNotesFormProps {
  defaultValues: UpdateSnapshotNotesInput
  onSubmit: (values: UpdateSnapshotNotesInput) => void
  onCancel: () => void
  isSubmitting?: boolean
  errors?: z.core.$ZodFlattenedError<UpdateSnapshotNotesInput>
}

export function UpdateSnapshotNotesForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errors,
}: UpdateSnapshotNotesFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: UpdateSnapshotNotesSchema,
    },
    onSubmitInvalid: () => {
      const InvalidInput = document.querySelector('[aria-invalid="true"]') as HTMLInputElement
      InvalidInput?.focus()
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  useEffect(() => {
    setFormErrors<UpdateSnapshotNotesInput>(form, errors)
  }, [errors, form])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="notes"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel className="sr-only" htmlFor="snapshot-notes">
                Notes
              </FieldLabel>
              <Textarea
                id="snapshot-notes"
                name={field.name}
                value={field.state.value || undefined}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="min-h-26"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onCancel()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Submit
        </Button>
      </div>
    </form>
  )
}
