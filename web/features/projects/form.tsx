'use client'

import { useForm } from '@tanstack/react-form'
import { CheckIcon, CopyIcon, Plus, RefreshCcwIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import InputTags from '@/components/input-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BrowserLists } from '@/constants/app'
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
        name="snapshotBrowsers"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="pageRule-snapshotBrowsers">Browsers</FieldLabel>
              <InputTags
                defaultValue={field.state.value}
                tags={BrowserLists}
                onRemove={(value) => field.handleChange(value)}
                onSelect={(value) => field.handleChange(value)}
              />
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
      <form.Field
        name="viewports"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <>
              <div className="flex flex-col items-start gap-3">
                <FieldLabel htmlFor="pageRule-viewports">Viewports</FieldLabel>
                <Field data-invalid={isInvalid}>
                  <Card>
                    <CardContent className="flex flex-col gap-3">
                      {field.state.value &&
                        field.state.value.map((_obj, index) => (
                          <div key={index} className="w-full">
                            <form.Field
                              name={`viewports[${index}]`}
                              children={(viewportField) => {
                                const isValueInvalid =
                                  viewportField.state.meta.isTouched && !viewportField.state.meta.isValid
                                return (
                                  <div className="flex gap-3">
                                    <Field data-invalid={isValueInvalid}>
                                      <FieldLabel htmlFor="pageRule-viewports-width">Width</FieldLabel>
                                      <Input
                                        id="pageRule-viewports-width"
                                        name={viewportField.name}
                                        value={viewportField.state.value.at(0)}
                                        onBlur={viewportField.handleBlur}
                                        onChange={(e) => {
                                          const value = Number(e.target.value)

                                          if (!Number.isNaN(value)) {
                                            viewportField.handleChange((prev) => {
                                              return [value, prev[1]]
                                            })
                                          }
                                        }}
                                        aria-invalid={isValueInvalid}
                                      />
                                      {isValueInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                    <Field data-invalid={isValueInvalid}>
                                      <FieldLabel htmlFor="pageRule-viewports-height">Height</FieldLabel>
                                      <Input
                                        id="pageRule-viewports-height"
                                        name={viewportField.name}
                                        value={viewportField.state.value[1] ?? ''}
                                        onBlur={viewportField.handleBlur}
                                        onChange={(e) => {
                                          const value = Number(e.target.value)

                                          if (!Number.isNaN(value)) {
                                            viewportField.handleChange((prev) => {
                                              return [prev[0], value]
                                            })
                                          }
                                        }}
                                        aria-invalid={isValueInvalid}
                                      />
                                      {isValueInvalid && <FieldError errors={viewportField.state.meta.errors} />}
                                    </Field>
                                  </div>
                                )
                              }}
                            />
                          </div>
                        ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => field.handleChange((old) => [...old, [0, 0]])}
                      >
                        <Plus /> Add Viewport
                      </Button>
                    </CardContent>
                  </Card>
                </Field>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </div>
            </>
          )
        }}
      />
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
