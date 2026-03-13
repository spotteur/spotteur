'use client'

import { useForm, useStore } from '@tanstack/react-form'
import { ChevronDown, Import, Info, MoreHorizontal, Plus, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { type z } from 'zod'

import { BrowserCombobox } from '@/components/browser-combobox'
import { ImportFromSitemapDialog } from '@/components/import-from-sitemap-dialog'
import { MonacoEditorInput } from '@/components/monaco-editor-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ViewportDimensionInput } from '@/components/viewport-dimension-input'
import {
  RULE_ATTR_TYPE_PLACEHOLDER_MAP,
  RULE_ATTR_TYPE_OPTIONS,
  RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS,
  RULE_ATTR_TYPE_LABEL_MAP,
  type Browser,
} from '@/constants/enum'
import { setFormErrors } from '@/lib/utils'

import {
  type PageRuleCreateFormInput,
  PageRuleBaseSchema,
  PageRuleCreateSchema,
  type PageRuleFormInput,
} from './schema'

interface PageRuleFormProps {
  defaultValues: PageRuleFormInput
  onSubmit: (values: PageRuleFormInput) => void
  isSubmitting?: boolean
  errors?: z.core.$ZodFlattenedError<PageRuleFormInput>
  projectId: string
  onDirtyChange: (isDirty: boolean) => void
  onFormReady?: (resetForm: (values: PageRuleFormInput) => void) => void
}

const hasErrorForPrefixes = (fieldNames: string[], prefixes: string[]) => {
  return fieldNames.some((fieldName) =>
    prefixes.some(
      (prefix) => fieldName === prefix || fieldName.startsWith(`${prefix}.`) || fieldName.startsWith(`${prefix}[`),
    ),
  )
}

interface CreatePageRuleFormProps {
  defaultValues: PageRuleCreateFormInput
  onSubmit: (values: PageRuleCreateFormInput) => void
  onCancel: () => void
  isSubmitting: boolean
  errors?: z.core.$ZodFlattenedError<PageRuleCreateFormInput>
}

export function CreatePageRuleForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errors = undefined,
}: CreatePageRuleFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: PageRuleCreateSchema,
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

  useEffect(() => {
    setFormErrors<PageRuleCreateFormInput>(form, errors)
  }, [errors, form])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="pagePaths"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <div className="flex justify-between">
                <FieldLabel htmlFor="createPage-pagePaths">Page paths</FieldLabel>
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
                id="createPage-pagePaths"
                className="max-h-64"
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
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Submit
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      <ImportFromSitemapDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={(paths) => {
          if (pagePathsFieldRef.current) {
            const currentValue = pagePathsFieldRef.current.state.value
            const newValue = currentValue ? `${currentValue}\n${paths}` : paths
            pagePathsFieldRef.current.handleChange(newValue)
          }
        }}
      />
    </form>
  )
}

export function PageRuleForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  errors = undefined,
  projectId,
  onDirtyChange,
  onFormReady,
}: PageRuleFormProps) {
  const [viewportsSectionOpen, setViewportsSectionOpen] = useState(false)
  const [rulesSectionOpen, setRulesSectionOpen] = useState(false)
  const [hooksSectionOpen, setHooksSectionOpen] = useState(false)
  const [proxySectionOpen, setProxySectionOpen] = useState(false)

  const openSectionsWithInvalidFields = (fieldNames: string[]) => {
    if (hasErrorForPrefixes(fieldNames, ['viewports'])) {
      setViewportsSectionOpen(true)
    }

    if (hasErrorForPrefixes(fieldNames, ['rules'])) {
      setRulesSectionOpen(true)
    }

    if (hasErrorForPrefixes(fieldNames, ['hookAfterPageLoad', 'hookBeforeScreenshot'])) {
      setHooksSectionOpen(true)
    }

    if (hasErrorForPrefixes(fieldNames, ['proxy'])) {
      setProxySectionOpen(true)
    }
  }

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: PageRuleBaseSchema,
    },
    onSubmitInvalid: (args) => {
      const fieldErrors = args.formApi.getAllErrors().fields as Record<string, unknown>
      openSectionsWithInvalidFields(Object.keys(fieldErrors || {}))

      const InvalidInput = document.querySelector('[aria-invalid="true"]') as HTMLInputElement
      InvalidInput?.focus()
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  useEffect(() => {
    setFormErrors<PageRuleFormInput>(form, errors)
  }, [errors, form])

  const serverFieldErrorKeys = Object.keys(errors?.fieldErrors || {})
  const hasServerViewportsErrors = hasErrorForPrefixes(serverFieldErrorKeys, ['viewports'])
  const hasServerRulesErrors = hasErrorForPrefixes(serverFieldErrorKeys, ['rules'])
  const hasServerHooksErrors = hasErrorForPrefixes(serverFieldErrorKeys, ['hookAfterPageLoad', 'hookBeforeScreenshot'])
  const hasServerProxyErrors = hasErrorForPrefixes(serverFieldErrorKeys, ['proxy'])

  const isFormDirty = useStore(form.store, (state) => state.isDirty)
  useEffect(() => {
    onDirtyChange(isFormDirty)
  }, [isFormDirty, onDirtyChange])

  useEffect(() => {
    if (onFormReady) {
      const resetForm = (values: PageRuleFormInput) => {
        form.reset(values)
      }
      onFormReady(resetForm)
    }
  }, [form, onFormReady])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="snapshotBrowsers"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="pageRule-snapshotBrowsers">Browsers</FieldLabel>
              <BrowserCombobox
                id="pageRule-snapshotBrowsers"
                value={field.state.value as Browser[]}
                onValueChange={(value) => field.handleChange(value as Browser[])}
                isInvalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <FieldGroup className="grid gap-3 py-2 xl:grid-cols-2">
        <form.Field
          name="mediaReset"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <FieldLabel>
                <Field orientation="horizontal" data-invalid={isInvalid}>
                  <Checkbox
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                    aria-invalid={isInvalid}
                  />
                  <FieldContent>
                    <FieldTitle>Media reset</FieldTitle>
                    <FieldDescription>If checked, resets all time-based media to a static state.</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldContent>
                </Field>
              </FieldLabel>
            )
          }}
        />
        <form.Field
          name="reducedMotion"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <FieldLabel>
                <Field orientation="horizontal" data-invalid={isInvalid}>
                  <Checkbox
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                    aria-invalid={isInvalid}
                  />
                  <FieldContent>
                    <FieldTitle>Reduce Motion</FieldTitle>
                    <FieldDescription>If checked, disables CSS animations and transitions.</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldContent>
                </Field>
              </FieldLabel>
            )
          }}
        />
      </FieldGroup>

      <form.Field
        name="viewports"
        mode="array"
        children={(viewportsField) => {
          const isViewportsInvalid = viewportsField.state.meta.isTouched && !viewportsField.state.meta.isValid
          return (
            <Card>
              <Collapsible
                open={viewportsSectionOpen || hasServerViewportsErrors}
                onOpenChange={setViewportsSectionOpen}
              >
                <CardHeader>
                  <CardTitle className="relative w-fit">
                    <span>Viewports</span>
                    {viewportsField.state.value.length > 0 && (
                      <Badge className="absolute -top-2.5 -right-5.5 h-5 min-w-5 px-1 tabular-nums">
                        {viewportsField.state.value.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Define the viewports to capture screenshots for.</CardDescription>
                  <CardAction className="space-x-3">
                    {viewportsSectionOpen && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => viewportsField.pushValue([0, 0])}
                      >
                        <Plus /> Add viewport
                      </Button>
                    )}
                    <CollapsibleTrigger asChild className="group">
                      <Button type="button" variant="ghost" size="icon-sm">
                        <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </CardAction>
                </CardHeader>
                <CollapsibleContent asChild>
                  <CardContent className="space-y-6 pt-6">
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
                      {isViewportsInvalid && <FieldError errors={viewportsField.state.meta.errors} />}
                    </Field>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        }}
      />

      <form.Field
        name="rules"
        mode="array"
        children={(rulesField) => {
          const isRulesInvalid =
            (rulesField.state.meta.isTouched && !rulesField.state.meta.isValid) ||
            rulesField.getMeta().errors?.length > 0
          return (
            <Card>
              <Collapsible open={rulesSectionOpen || hasServerRulesErrors} onOpenChange={setRulesSectionOpen}>
                <CardHeader>
                  <CardTitle className="relative w-fit">
                    <span>Rules</span>
                    {(rulesField.state.value || []).length > 0 && (
                      <Badge className="absolute -top-2.5 -right-5.5 h-5 min-w-5 px-1 tabular-nums">
                        {rulesField.state.value?.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Define rules to apply to specified elements on the page before screenshot is taken.
                  </CardDescription>
                  <CardAction className="space-x-3">
                    {rulesSectionOpen && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          rulesField.pushValue({ attrs: [], selectors: [''], identifier: crypto.randomUUID() })
                        }
                      >
                        <Plus /> Add rule
                      </Button>
                    )}
                    <CollapsibleTrigger asChild className="group">
                      <Button type="button" variant="ghost" size="icon-sm">
                        <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </CardAction>
                </CardHeader>
                <CollapsibleContent asChild>
                  <CardContent className="space-y-6 pt-6">
                    <Field data-invalid={isRulesInvalid} className="flex flex-col gap-3 space-y-3">
                      {(rulesField.state.value || []).map((_, ruleIndex) => (
                        <Card key={ruleIndex} className="w-full gap-4 py-4">
                          <CardHeader className="px-4">
                            <form.Field
                              name={`rules[${ruleIndex}].identifier`}
                              children={(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                  <Field data-invalid={isInvalid}>
                                    <InputGroup className="max-w-md">
                                      <InputGroupAddon>Rule #{ruleIndex + 1}</InputGroupAddon>
                                      <InputGroupInput
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                      />
                                      <InputGroupAddon align="inline-end">
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <InputGroupButton variant="ghost" size="icon-xs">
                                              <Info />
                                            </InputGroupButton>
                                          </PopoverTrigger>
                                          <PopoverContent>
                                            <PopoverHeader>
                                              <PopoverTitle>
                                                The rule identifier is used for internal reference only.
                                              </PopoverTitle>
                                            </PopoverHeader>
                                          </PopoverContent>
                                        </Popover>
                                      </InputGroupAddon>
                                    </InputGroup>
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                  </Field>
                                )
                              }}
                            />
                            <CardAction>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon-sm" variant="ghost">
                                    <MoreHorizontal />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => {
                                      rulesField.removeValue(ruleIndex)
                                    }}
                                  >
                                    <Trash />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardAction>
                          </CardHeader>
                          <CardContent className="grid grid-cols-3 gap-6 px-4 xl:grid-cols-6">
                            <form.Field
                              mode="array"
                              name={`rules[${ruleIndex}].selectors`}
                              children={(ruleSelectorsField) => {
                                const isInvalid =
                                  ruleSelectorsField.state.meta.isTouched && !ruleSelectorsField.state.meta.isValid
                                return (
                                  <Field
                                    data-invalid={isInvalid}
                                    className="col-span-4 flex flex-col gap-3 xl:col-span-3"
                                  >
                                    <div className="flex justify-between">
                                      <FieldLabel>Selectors</FieldLabel>
                                      <Button type="button" size="xs" onClick={() => ruleSelectorsField.pushValue('')}>
                                        <Plus />
                                        Add selector
                                      </Button>
                                    </div>
                                    {(ruleSelectorsField.state.value || []).map((_, ruleSelectorIndex) => (
                                      <div key={ruleSelectorIndex} className="flex items-start justify-between gap-3">
                                        <form.Field
                                          name={`rules[${ruleIndex}].selectors[${ruleSelectorIndex}]`}
                                          children={(field) => {
                                            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                            return (
                                              <Field data-invalid={isInvalid}>
                                                <Textarea
                                                  name={field.name}
                                                  value={field.state.value}
                                                  onBlur={field.handleBlur}
                                                  onChange={(e) => field.handleChange(e.target.value)}
                                                  className="min-h-18"
                                                  placeholder="Write any valid CSS selector, e.g. #main-content"
                                                  aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                              </Field>
                                            )
                                          }}
                                        />

                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          disabled={ruleSelectorsField.state.value?.length === 1}
                                          onClick={() => ruleSelectorsField.removeValue(ruleSelectorIndex)}
                                          className="self-center"
                                        >
                                          <X />
                                          <span className="sr-only">Remove selector</span>
                                        </Button>
                                      </div>
                                    ))}
                                    {isInvalid && <FieldError errors={ruleSelectorsField.state.meta.errors} />}
                                  </Field>
                                )
                              }}
                            />
                            <form.Field
                              mode="array"
                              name={`rules[${ruleIndex}].attrs`}
                              children={(ruleAttrsField) => {
                                const isInvalid =
                                  ruleAttrsField.state.meta.isTouched && !ruleAttrsField.state.meta.isValid
                                return (
                                  <Field
                                    data-invalid={isInvalid}
                                    className="col-span-4 flex flex-col gap-3 xl:col-span-3"
                                  >
                                    <div className="flex justify-between">
                                      <FieldLabel>Rule attributes</FieldLabel>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button type="button" size="xs">
                                            <Plus />
                                            Add rule attribute
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-60">
                                          <DropdownMenuGroup>
                                            {RULE_ATTR_TYPE_OPTIONS.filter(
                                              // Filter out options that already exist in the current attributes
                                              (option) =>
                                                !(ruleAttrsField.state.value || []).some(
                                                  (attr) => attr.name === option.value,
                                                ),
                                            ).map(({ value, label }) => (
                                              <DropdownMenuItem
                                                key={value}
                                                onClick={() => {
                                                  if (RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS.find((r) => r === value)) {
                                                    ruleAttrsField.pushValue({ name: value, value: 'true' })
                                                  } else {
                                                    ruleAttrsField.pushValue({ name: value, value: '' })
                                                  }
                                                }}
                                              >
                                                {label}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-3 space-y-2">
                                      {(ruleAttrsField.state.value || []).map((attrObj, ruleAttrIndex) => (
                                        <div key={ruleAttrIndex} className="flex items-start justify-between gap-3">
                                          <FieldGroup className="grid grid-cols-2">
                                            <form.Field
                                              name={`rules[${ruleIndex}].attrs[${ruleAttrIndex}].name`}
                                              children={(field) => {
                                                const isInvalid =
                                                  field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                  <Field data-invalid={isInvalid}>
                                                    <Input
                                                      name={field.name}
                                                      value={
                                                        field.state.value
                                                          ? RULE_ATTR_TYPE_LABEL_MAP[field.state.value]
                                                          : ''
                                                      }
                                                      onBlur={field.handleBlur}
                                                      readOnly
                                                      aria-invalid={isInvalid}
                                                    />
                                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                                  </Field>
                                                )
                                              }}
                                            />
                                            <form.Field
                                              name={`rules[${ruleIndex}].attrs[${ruleAttrIndex}].value`}
                                              children={(field) => {
                                                const isInvalid =
                                                  field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                  <Field data-invalid={isInvalid}>
                                                    <Input
                                                      id={`pageRule-rules[${ruleIndex}]-attrs[${ruleAttrIndex}]-value`}
                                                      value={field.state.value?.toString()}
                                                      onBlur={field.handleBlur}
                                                      aria-invalid={isInvalid}
                                                      placeholder={RULE_ATTR_TYPE_PLACEHOLDER_MAP[attrObj.name]}
                                                      onChange={(e) => field.handleChange(e.target.value)}
                                                      readOnly={
                                                        !!RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS.find(
                                                          (r) => r.toString() === attrObj.name,
                                                        )
                                                      }
                                                    />
                                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                                  </Field>
                                                )
                                              }}
                                            />
                                          </FieldGroup>

                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => ruleAttrsField.removeValue(ruleAttrIndex)}
                                            className="self-center"
                                          >
                                            <X />
                                            <span className="sr-only">Remove rule attribute</span>
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                    {isInvalid && <FieldError errors={ruleAttrsField.state.meta.errors} />}
                                  </Field>
                                )
                              }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </Field>
                    {isRulesInvalid && <FieldError errors={rulesField.state.meta.errors} />}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        }}
      />

      <Card>
        <Collapsible open={hooksSectionOpen || hasServerHooksErrors} onOpenChange={setHooksSectionOpen}>
          <CardHeader>
            <CardTitle>Hooks</CardTitle>
            <CardDescription>
              Define hooks to run custom JavaScript code on the page on a specific event.
            </CardDescription>
            <CardAction>
              <CollapsibleTrigger asChild className="group">
                <Button type="button" variant="ghost" size="icon-sm">
                  <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </CardAction>
          </CardHeader>
          <CollapsibleContent asChild>
            <CardContent className="space-y-6 pt-6">
              <form.Field
                name="hookAfterPageLoad"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="pageRule-hookAfterPageLoad">After Page Load</FieldLabel>
                      <MonacoEditorInput
                        wrapperProps={{ id: 'pageRule-hookAfterPageLoad' }}
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
              <form.Field
                name="hookBeforeScreenshot"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="pageRule-hookBeforeScreenshot">Before Screenshot</FieldLabel>
                      <MonacoEditorInput
                        wrapperProps={{ id: 'pageRule-hookBeforeScreenshot' }}
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
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <Collapsible open={proxySectionOpen || hasServerProxyErrors} onOpenChange={setProxySectionOpen}>
          <CardHeader>
            <CardTitle>Proxy</CardTitle>
            <CardDescription>Configure a proxy server to be used when accessing the page.</CardDescription>
            <CardAction>
              <CollapsibleTrigger asChild className="group">
                <Button type="button" variant="ghost" size="icon-sm">
                  <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </CardAction>
          </CardHeader>
          <CollapsibleContent asChild>
            <CardContent className="pt-6">
              <form.Field
                name="proxy"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="pageRule-proxy">Proxy server</FieldLabel>
                      <Input
                        id="pageRule-proxy"
                        name={field.name}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value || null)}
                        placeholder="http://1.1.1.1:8080"
                        aria-invalid={isInvalid}
                      />
                      <FieldDescription>
                        Only unauthenticated HTTP proxies are supported. Accepted format{' '}
                        <code className="font-mono">host:port</code> or{' '}
                        <code className="font-mono">protocol://host:port</code>.
                      </FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Submit
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/projects/${projectId}/pages`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
