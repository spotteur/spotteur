'use client'

import { useForm } from '@tanstack/react-form'
import { CheckIcon, CopyIcon, RefreshCcwIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProjectBrowserEnum, ProjectCreateSchema } from '@/features/projects/schema'
import { setFormErrors } from '@/lib/utils'

export type ProjectFormInput = z.infer<typeof ProjectCreateSchema> & { id?: string }

interface ProjectFormProps {
  defaultValues: ProjectFormInput
  onSubmit: (values: ProjectFormInput) => void
  submitLabel?: string
  isSubmitting?: boolean
  errors?: z.core.$ZodFlattenedError<ProjectFormInput>
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
  errors = undefined,
}: ProjectFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ProjectCreateSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  const [copied, setCopied] = useState(false)
  const [regenerated, setRegenerated] = useState(false)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const regenerateResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setFormErrors<ProjectFormInput>(form, errors)
  }, [errors, form])

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }

      if (regenerateResetRef.current) {
        clearTimeout(regenerateResetRef.current)
      }
    }
  }, [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="name"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-name">Name</FieldLabel>
              <Input
                id="project-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              <FieldDescription>The name of the project</FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="baseUrl"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-baseUrl">Base URL</FieldLabel>
              <Input
                id="project-baseUrl"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              <FieldDescription>
                The base URL for the project including http:// or https:// (e.g., https://example.com)
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="token"
        children={(field) => {
          const tokenValue = field.state.value ?? ''

          const handleCopy = async () => {
            try {
              await navigator.clipboard.writeText(tokenValue)
              setCopied(true)
              if (copyResetRef.current) {
                clearTimeout(copyResetRef.current)
              }
              copyResetRef.current = setTimeout(() => setCopied(false), 3000)
            } catch (error) {
              console.error('Failed to copy token', error)
            }
          }

          const handleRegenerate = () => {
            const newToken = 'sptpt_' + crypto.randomUUID().replaceAll('-', '')
            field.handleChange(newToken)
            setRegenerated(true)
            if (regenerateResetRef.current) {
              clearTimeout(regenerateResetRef.current)
            }
            regenerateResetRef.current = setTimeout(() => setRegenerated(false), 3000)
          }

          return (
            <Field>
              <FieldLabel htmlFor="project-token">Token</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="project-token"
                  name={field.name}
                  value={tokenValue}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Tooltip open={copied}>
                  <TooltipTrigger asChild>
                    <InputGroupButton
                      size="icon-sm"
                      variant="ghost"
                      type="button"
                      aria-label="Copy token"
                      onClick={handleCopy}
                    >
                      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>Token copied</TooltipContent>
                </Tooltip>
                <Tooltip open={regenerated}>
                  <TooltipTrigger asChild>
                    <InputGroupButton
                      size="icon-sm"
                      variant="ghost"
                      type="button"
                      aria-label="Generate new token"
                      disabled={regenerated}
                      className="disabled:opacity-100"
                      onClick={handleRegenerate}
                    >
                      {regenerated ? <CheckIcon className="size-4" /> : <RefreshCcwIcon className="size-4" />}
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>New token generated</TooltipContent>
                </Tooltip>
              </InputGroup>
              <FieldDescription>Optional authentication token for automated access</FieldDescription>
            </Field>
          )
        }}
      />
      <form.Field
        name="snapshotBrowser"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-snapshotBrowser">Browser</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value as ProjectFormInput['snapshotBrowser'])}
              >
                <SelectTrigger id="project-snapshotBrowser" aria-invalid={isInvalid}>
                  <SelectValue placeholder="Select browser" />
                </SelectTrigger>
                <SelectContent>
                  {ProjectBrowserEnum.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Browser to use for capturing snapshots</FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="snapshotSelector"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-snapshotSelector">Selector</FieldLabel>
              <Input
                id="project-snapshotSelector"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              <FieldDescription>Selector for the snapshots (e.g., .container, #container, or footer)</FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="snapshotWidth"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="project-snapshotWidth">Width</FieldLabel>
                <Input
                  id="project-snapshotWidth"
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  aria-invalid={isInvalid}
                />
                <FieldDescription>Value in pixels (e.g., 1200)</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="snapshotHeight"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="project-snapshotHeight">Height</FieldLabel>
                <Input
                  id="project-snapshotHeight"
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  aria-invalid={isInvalid}
                />
                <FieldDescription>Value in pixels (e.g., 800)</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </div>
      <form.Field
        name="pagePaths"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-pagePaths">Page Paths</FieldLabel>
              <Textarea
                id="project-pagePaths"
                name={field.name}
                value={Array.isArray(field.state.value) ? field.state.value.join('\n') : ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value.split(/\r?\n/).map((s) => s.trim()))}
                aria-invalid={isInvalid}
              />
              <FieldDescription>Each path must start with / (e.g., /pricing)</FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              {submitLabel}
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        <Link href="/projects">
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}
