'use client'

import { Editor, type EditorProps } from '@monaco-editor/react'
import { useForm, useStore } from '@tanstack/react-form'
import { ChevronDown, Info, MoreHorizontal, Plus, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { type z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  BROWSER_OPTIONS,
  RULE_ATTR_TYPE_PLACEHOLDER_MAP,
  RULE_ATTR_TYPE_OPTIONS,
  RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS,
  RULE_ATTR_TYPE_LABEL_MAP,
  type Browser,
  BROWSER_LABEL_MAP,
} from '@/constants/enum'
import { type projects } from '@/db/schema'
import { setFormErrors } from '@/lib/utils'

import { PageRuleBaseSchema, type PageRuleFormInput } from './schema'

interface PageRuleV2FormProps {
  defaultValues: PageRuleFormInput
  onSubmit: (values: PageRuleFormInput) => void
  isSubmitting?: boolean
  errors?: z.core.$ZodFlattenedError<PageRuleFormInput>
  project: typeof projects.$inferSelect
  onDirtyChange: (isDirty: boolean) => void
  onFormReady?: (resetForm: (values: PageRuleFormInput) => void) => void
}

export function PageRuleV2Form({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  errors = undefined,
  project,
  onDirtyChange,
  onFormReady,
}: PageRuleV2FormProps) {
  const [viewportsSectionOpen, setViewportsSectionOpen] = useState(false)
  const [rulesSectionOpen, setRulesSectionOpen] = useState(false)
  const [hooksSectionOpen, setHooksSectionOpen] = useState(false)

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: PageRuleBaseSchema,
    },
    onSubmitInvalid: () => {
      const InvalidInput = document.querySelector('[aria-invalid="true"]') as HTMLInputElement

      InvalidInput?.focus()
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  const monacoOptions = {
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
    lineNumbersMinChars: 3,
  } satisfies EditorProps['options']

  useEffect(() => {
    setFormErrors<PageRuleFormInput>(form, errors)
  }, [errors, form])

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
    <>
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
                <Combobox
                  id="pageRule-snapshotBrowsers"
                  multiple
                  autoHighlight
                  items={BROWSER_OPTIONS}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <ComboboxChips className="w-sm">
                    <ComboboxValue>
                      {(values: Browser[]) => (
                        <>
                          {values.map((value) => (
                            <ComboboxChip key={value}>{BROWSER_LABEL_MAP[value]}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput aria-invalid={isInvalid} />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent data-side="bottom">
                    <ComboboxEmpty>No browser found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: (typeof BROWSER_OPTIONS)[number]) => (
                        <ComboboxItem key={item.value} value={item.value}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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
                    <FieldContent className="grid gap-3">
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
                    <FieldContent className="grid gap-3">
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
          mode="array"
          name="viewports"
          children={(viewportsField) => {
            const isViewportsInvalid = viewportsField.state.meta.isTouched && !viewportsField.state.meta.isValid
            return (
              <Card>
                <Collapsible open={viewportsSectionOpen} onOpenChange={setViewportsSectionOpen}>
                  <CardHeader>
                    <CardTitle className="relative w-fit">
                      <span className={isViewportsInvalid ? 'text-destructive' : undefined}>Viewports</span>
                      {Array.isArray(viewportsField.state.value) && viewportsField.state.value.length > 0 && (
                        <Badge className="absolute -top-2.5 -right-5.5 h-5 min-w-5 px-1 tabular-nums">
                          {viewportsField.state.value.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className={isViewportsInvalid ? 'text-destructive' : undefined}>
                      Define the viewports to capture screenshots for.
                    </CardDescription>
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
                        {(viewportsField.state.value || []).map((_, viewportIndex) => (
                          <div key={viewportIndex} className="flex items-start justify-between gap-3">
                            <FieldGroup className="grid grid-cols-2 gap-3">
                              <form.Field
                                name={`viewports[${viewportIndex}][0]`}
                                children={(viewportWidthField) => {
                                  const isInvalid =
                                    viewportWidthField.state.meta.isTouched && !viewportWidthField.state.meta.isValid
                                  return (
                                    <Field data-invalid={isViewportsInvalid || isInvalid}>
                                      <InputGroup>
                                        <InputGroupAddon>
                                          <InputGroupText>Width</InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                          name={viewportWidthField.name}
                                          value={viewportWidthField.state.value || '0'}
                                          onBlur={() => {
                                            if (isViewportsInvalid) viewportsField.handleBlur()
                                            viewportWidthField.handleBlur()
                                          }}
                                          onChange={(e) => {
                                            const value = Number(e.target.value)
                                            if (!Number.isNaN(value)) {
                                              viewportWidthField.handleChange(value)
                                            }
                                          }}
                                          aria-invalid={isViewportsInvalid || isInvalid}
                                        />
                                        <InputGroupAddon align="inline-end">
                                          <InputGroupText>px</InputGroupText>
                                        </InputGroupAddon>
                                      </InputGroup>
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
                                      <InputGroup>
                                        <InputGroupAddon>
                                          <InputGroupText>Height</InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                          name={viewportHeightField.name}
                                          value={viewportHeightField.state.value || '0'}
                                          onBlur={() => {
                                            if (isViewportsInvalid) viewportsField.handleBlur()
                                            viewportHeightField.handleBlur()
                                          }}
                                          onChange={(e) => {
                                            const value = Number(e.target.value)
                                            if (!Number.isNaN(value)) {
                                              viewportHeightField.handleChange(value)
                                            }
                                          }}
                                          aria-invalid={isViewportsInvalid || isInvalid}
                                        />
                                        <InputGroupAddon align="inline-end">
                                          <InputGroupText>px</InputGroupText>
                                        </InputGroupAddon>
                                      </InputGroup>
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
          mode="array"
          name="rules"
          children={(rulesField) => {
            const isRulesInvalid =
              (rulesField.state.meta.isTouched && !rulesField.state.meta.isValid) ||
              rulesField.getMeta().errors?.length > 0
            return (
              <Card>
                <Collapsible open={rulesSectionOpen} onOpenChange={setRulesSectionOpen}>
                  <CardHeader>
                    <CardTitle className="relative w-fit">
                      <span className={isRulesInvalid ? 'text-destructive' : undefined}>Rules</span>
                      {Array.isArray(rulesField.state.value) && rulesField.state.value.length > 0 && (
                        <Badge className="absolute -top-2.5 -right-5.5 h-5 min-w-5 px-1 tabular-nums">
                          {rulesField.state.value.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className={isRulesInvalid ? 'text-destructive' : undefined}>
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
                                        <Button
                                          type="button"
                                          size="xs"
                                          onClick={() => ruleSelectorsField.pushValue('')}
                                        >
                                          <Plus />
                                          Add selector
                                        </Button>
                                      </div>
                                      {Array.isArray(ruleSelectorsField.state.value) &&
                                        ruleSelectorsField.state.value.map((_, ruleSelectorIndex) => (
                                          <div
                                            key={ruleSelectorIndex}
                                            className="flex items-start justify-between gap-3"
                                          >
                                            <form.Field
                                              name={`rules[${ruleIndex}].selectors[${ruleSelectorIndex}]`}
                                              children={(field) => {
                                                const isInvalid =
                                                  field.state.meta.isTouched && !field.state.meta.isValid
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
                                                  !Array.isArray(ruleAttrsField.state.value) ||
                                                  !ruleAttrsField.state.value.some(
                                                    (attr) => attr.name === option.value,
                                                  ),
                                              ).map(({ value, label }) => (
                                                <DropdownMenuItem
                                                  key={value}
                                                  onClick={() => {
                                                    if (
                                                      RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS.find((r) => r === value)
                                                    ) {
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
                                        {Array.isArray(ruleAttrsField.state.value) &&
                                          ruleAttrsField.state.value.map((attrObj, ruleAttrIndex) => (
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
          <Collapsible open={hooksSectionOpen} onOpenChange={setHooksSectionOpen}>
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
                        <Editor
                          options={monacoOptions}
                          wrapperProps={{ id: 'pageRule-hookAfterPageLoad' }}
                          width="100%"
                          height="300px"
                          language="javascript"
                          value={field.state.value ?? undefined}
                          onChange={(value) => field.handleChange(value)}
                          theme="vs-dark"
                        />
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
                        <Editor
                          options={monacoOptions}
                          wrapperProps={{ id: 'pageRule-hookBeforeScreenshot' }}
                          width="100%"
                          height="300px"
                          language="javascript"
                          value={field.state.value ?? undefined}
                          onChange={(value) => field.handleChange(value)}
                          theme="vs-dark"
                        />
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
            <Link href={`/projects/${project.id}/pages`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </>
  )
}
