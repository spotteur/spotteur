'use client'

import { useForm } from '@tanstack/react-form'
import { CheckIcon, CopyIcon, Import, Plus, RefreshCcwIcon, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { type z } from 'zod'

import { BrowserCombobox } from '@/components/browser-combobox'
import { ImportFromSitemapDialog } from '@/components/import-from-sitemap-dialog'
import { MonacoEditorInput } from '@/components/monaco-editor-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ViewportDimensionInput } from '@/components/viewport-dimension-input'
import { type Browser } from '@/constants/enum'
import { ProjectCreateSchema, ProjectUpdateSchema } from '@/features/projects/schema'
import { setFormErrors } from '@/lib/utils'

export type ProjectFormInput = z.input<typeof ProjectCreateSchema | typeof ProjectUpdateSchema>

interface ProjectFormProps {
  defaultValues: ProjectFormInput
  onSubmit: (values: ProjectFormInput) => void
  submitLabel?: string
  isSubmitting?: boolean
  errors?: z.core.$ZodFlattenedError<ProjectFormInput>
  isCreate?: boolean
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Submit',
  isCreate = false,
  isSubmitting = false,
  errors = undefined,
}: ProjectFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: isCreate ? ProjectCreateSchema : ProjectUpdateSchema,
    },
    onSubmitInvalid: () => {
      const InvalidInput = document.querySelector('[aria-invalid="true"]') as HTMLInputElement
      InvalidInput?.focus()
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  type PagePathsFieldApi = ReturnType<typeof form.getFieldInfo<'pagePaths'>>['instance']
  const pagePathsFieldRef = useRef<PagePathsFieldApi | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

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
                The base URL with protocol and ended with trailing slash (e.g., https://example.com/)
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      {!isCreate && (
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
                  <InputGroupInput id="project-token" name={field.name} value={tokenValue} readOnly />
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
      )}
      <form.Field
        name="snapshotBrowsers"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-snapshotBrowsers">Browsers</FieldLabel>
              <BrowserCombobox
                id="project-snapshotBrowsers"
                name={field.name}
                value={field.state.value as Browser[]}
                onValueChange={(value) => field.handleChange(value as Browser[])}
                isInvalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="viewports"
        mode="array"
        children={(viewportsField) => {
          const isViewportsInvalid = viewportsField.state.meta.isTouched && !viewportsField.state.meta.isValid
          return (
            <>
              <div className="flex flex-col items-start gap-3">
                <FieldLabel htmlFor="project-viewports">Viewports</FieldLabel>
                <Field data-invalid={isViewportsInvalid}>
                  <Card>
                    <CardContent className="flex flex-col gap-3">
                      <Field data-invalid={isViewportsInvalid}>
                        {viewportsField.state.value.map((_, viewportIndex) => (
                          <div key={viewportIndex} className="flex items-start justify-between gap-3">
                            <FieldGroup className="grid grid-cols-2 gap-3">
                              <form.Field
                                name={`viewports[${viewportIndex}][0]`}
                                children={(viewportWidthField) => {
                                  const isInvalid =
                                    viewportWidthField.state.meta.isTouched && !viewportWidthField.state.meta.isValid
                                  return (
                                    <Field data-invalid={isViewportsInvalid || isInvalid}>
                                      <ViewportDimensionInput
                                        label="Width"
                                        value={viewportWidthField.state.value || '0'}
                                        onChange={viewportWidthField.handleChange}
                                        onBlur={() => {
                                          if (isViewportsInvalid) viewportsField.handleBlur()
                                          viewportWidthField.handleBlur()
                                        }}
                                        isInvalid={isViewportsInvalid || isInvalid}
                                      />
                                      {isInvalid && <FieldError errors={viewportWidthField.state.meta.errors} />}
                                    </Field>
                                  )
                                }}
                              />
                              <form.Field
                                name={`viewports[${viewportIndex}][1]`}
                                children={(viewportHeightField) => {
                                  const isInvalid =
                                    viewportHeightField.state.meta.isTouched && !viewportHeightField.state.meta.isValid
                                  return (
                                    <Field data-invalid={isViewportsInvalid || isInvalid}>
                                      <ViewportDimensionInput
                                        label="Height"
                                        value={viewportHeightField.state.value || '0'}
                                        onChange={viewportHeightField.handleChange}
                                        onBlur={() => {
                                          if (isViewportsInvalid) viewportsField.handleBlur()
                                          viewportHeightField.handleBlur()
                                        }}
                                        isInvalid={isViewportsInvalid || isInvalid}
                                      />
                                      {isInvalid && <FieldError errors={viewportHeightField.state.meta.errors} />}
                                    </Field>
                                  )
                                }}
                              />
                            </FieldGroup>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={viewportsField.state.value.length === 1}
                              onClick={() => viewportsField.removeValue(viewportIndex)}
                            >
                              <X />
                              <span className="sr-only">Remove viewport</span>
                            </Button>
                          </div>
                        ))}
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => viewportsField.handleChange((old) => [...old, [0, 0]])}
                      >
                        <Plus /> Add viewport
                      </Button>
                    </CardContent>
                  </Card>
                </Field>
                {isViewportsInvalid && <FieldError errors={viewportsField.state.meta.errors} />}
              </div>
            </>
          )
        }}
      />
      <form.Field
        name="cookieSetting"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="project-cookieSetting">Cookie Setting</FieldLabel>
              <Card>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <form.Field
                    name="cookieSetting.name"
                    children={(nameField) => {
                      const isNameInvalid = nameField.state.meta.isTouched && !nameField.state.meta.isValid
                      return (
                        <Field data-invalid={isNameInvalid}>
                          <FieldLabel htmlFor="project-cookieSetting-name">Name</FieldLabel>
                          <Input
                            id="project-cookieSetting-name"
                            name={nameField.name}
                            value={nameField.state.value || ''}
                            onBlur={nameField.handleBlur}
                            onChange={(e) => nameField.handleChange(e.target.value)}
                            aria-invalid={isNameInvalid}
                          />
                        </Field>
                      )
                    }}
                  />
                  <form.Field
                    name="cookieSetting.value"
                    children={(valueField) => {
                      const isValueInvalid = valueField.state.meta.isTouched && !valueField.state.meta.isValid
                      return (
                        <Field data-invalid={isValueInvalid}>
                          <FieldLabel htmlFor="project-cookieSetting-value">Value</FieldLabel>
                          <Input
                            id="project-cookieSetting-value"
                            name={valueField.name}
                            value={valueField.state.value || ''}
                            onBlur={valueField.handleBlur}
                            onChange={(e) => valueField.handleChange(e.target.value)}
                            aria-invalid={isValueInvalid}
                          />
                        </Field>
                      )
                    }}
                  />
                  <form.Field
                    name="cookieSetting.domain"
                    children={(domainField) => {
                      const isDomainInvalid = domainField.state.meta.isTouched && !domainField.state.meta.isValid
                      return (
                        <Field data-invalid={isDomainInvalid}>
                          <FieldLabel htmlFor="project-cookieSetting-domain">Domain</FieldLabel>
                          <Input
                            id="project-cookieSetting-domain"
                            name={domainField.name}
                            value={domainField.state.value || ''}
                            onBlur={domainField.handleBlur}
                            onChange={(e) => domainField.handleChange(e.target.value)}
                            aria-invalid={isDomainInvalid}
                          />
                          <FieldDescription>
                            The domain URL without protocol (e.g., example.com or www.example.com)
                          </FieldDescription>
                        </Field>
                      )
                    }}
                  />
                </CardContent>
                <CardFooter className="px-0">
                  <form.Field
                    name="cookieSetting.secure"
                    children={(secureField) => {
                      return (
                        <FieldLabel className="border-none">
                          <Field orientation="horizontal" className="flex items-center gap-2 px-6!">
                            <Checkbox
                              name={secureField.name}
                              checked={secureField.state.value}
                              onCheckedChange={(checked) => secureField.handleChange(!!checked)}
                            />
                            <FieldTitle>Secure</FieldTitle>
                          </Field>
                        </FieldLabel>
                      )
                    }}
                  />
                </CardFooter>
              </Card>
            </Field>
          )
        }}
      />
      {isCreate && (
        <form.Field
          name="pagePaths"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <div className="flex justify-between">
                  <FieldLabel htmlFor="project-pagePaths">Page paths</FieldLabel>
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => {
                      pagePathsFieldRef.current = field
                      setImportDialogOpen(true)
                    }}
                  >
                    <Import />
                    Import from sitemap
                  </Button>
                </div>
                <Textarea
                  id="project-pagePaths"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                <FieldDescription>Each path must start with a slash (e.g., /pricing)</FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      )}
      {!isCreate && (
        <form.Field
          name="hookAfterPageLoad"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="project-hookAfterPageLoad">Global Hook After Page Load</FieldLabel>
                <MonacoEditorInput
                  height="300px"
                  language="javascript"
                  value={field.state.value ?? undefined}
                  onChange={(value) => field.handleChange(value)}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      )}
      {!isCreate && (
        <form.Field
          name="hookBeforeScreenshot"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="project-hookBeforeScreenshot">Global Hook Before Screenshot</FieldLabel>
                <MonacoEditorInput
                  height="300px"
                  language="javascript"
                  value={field.state.value ?? undefined}
                  onChange={(value) => field.handleChange(value)}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      )}
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
        <Button variant="secondary" asChild>
          <Link href="/projects">Cancel</Link>
        </Button>
      </div>

      <ImportFromSitemapDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={(paths) => {
          if (pagePathsFieldRef.current) {
            const currentValue = pagePathsFieldRef.current?.state.value
            const newValue = currentValue ? `${currentValue}\n${paths}` : paths
            pagePathsFieldRef.current.handleChange(newValue)
          }
        }}
      />
    </form>
  )
}
