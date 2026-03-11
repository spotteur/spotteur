'use client'

import { useForm } from '@tanstack/react-form'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  UpdateBuildNotesSchema,
  TriggerBuildSchema,
  type UpdateBuildNotesInput,
  type TriggerBuildInput,
} from '@/features/builds/schema'

interface TriggerBuildFormProps {
  defaultValues: TriggerBuildInput
  onSubmit: (values: TriggerBuildInput) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function TriggerBuildForm({ defaultValues, onSubmit, onCancel, isSubmitting = false }: TriggerBuildFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: TriggerBuildSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

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
        name="baseUrl"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="build-baseUrl">Base URL</FieldLabel>
              <Input
                id="build-baseUrl"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              <FieldDescription>
                The base URL with protocol and ended with trailing slash (e.g., https://example.com/)
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="notes"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="build-notes">Notes</FieldLabel>
              <Textarea
                id="build-notes"
                name={field.name}
                value={field.state.value || undefined}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="min-h-26"
                placeholder="Add your notes about this build here. It can be anything you want to remember or share about this build."
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

interface UpdateBuildNotesFormProps {
  defaultValues: UpdateBuildNotesInput
  onSubmit: (values: UpdateBuildNotesInput) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function UpdateBuildNotesForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: UpdateBuildNotesFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: UpdateBuildNotesSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

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
              <FieldLabel className="sr-only" htmlFor="build-notes">
                Notes
              </FieldLabel>
              <Textarea
                id="build-notes"
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
