'use client'

import { useForm } from '@tanstack/react-form'
import { Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { type z } from 'zod'

import InputTags from '@/components/input-tags'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  BROWSER_OPTIONS,
  RULE_ATTR_TYPE_PLACEHOLDER_MAP,
  type RuleAttrType,
  RULE_ATTR_TYPE_OPTIONS,
  RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS,
} from '@/constants/enum'
import { type projects } from '@/db/schema'
import { PageRuleCreateSchema } from '@/features/page-rules/schema'
import { setFormErrors } from '@/lib/utils'

export type PageRuleFormInput = z.infer<typeof PageRuleCreateSchema> & { id?: string }

interface PageRuleFormProps {
  defaultValues: PageRuleFormInput
  onSubmit: (values: PageRuleFormInput) => void
  submitLabel?: string
  isSubmitting?: boolean
  errors?: z.core.$ZodFlattenedError<PageRuleFormInput>
  project: typeof projects.$inferSelect
}

export default function PageRuleForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
  errors = undefined,
  project,
}: PageRuleFormProps) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: PageRuleCreateSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  useEffect(() => {
    setFormErrors<PageRuleFormInput>(form, errors)
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
        name="pagePath"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="pageRules-pagePath">Page Path</FieldLabel>
              <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)}>
                <SelectTrigger id="pageRules-pagePath" aria-invalid={isInvalid}>
                  <SelectValue placeholder="Select path" />
                </SelectTrigger>
                <SelectContent>
                  {project.pagePaths.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>path to use for capturing snapshots and implement the rule.</FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                tags={BROWSER_OPTIONS}
                onRemove={(value) => field.handleChange(value)}
                onSelect={(value) => field.handleChange(value)}
              />
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
                                        value={viewportField.state.value.at(0) ?? '0'}
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
                                        value={viewportField.state.value[1] ?? '0'}
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
        name="mediaReset"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="mediaReset"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <div className="grid gap-3">
                  <FieldLabel htmlFor="pageRule-mediaReset">Media reset</FieldLabel>
                  <p className="text-muted-foreground text-sm">
                    If checked, resets all time-based media to a static state.
                  </p>
                </div>
              </div>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="reducedMotion"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reducedMotion"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <div className="grid gap-3">
                  <FieldLabel htmlFor="pageRule-reducedMotion">Reduce Motion</FieldLabel>
                  <p className="text-muted-foreground text-sm">If checked, disables CSS animations and transitions.</p>
                </div>
              </div>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field name="rules">
        {(rulesField) => (
          <div className="flex flex-col gap-3 space-y-3">
            <label className="text-base font-medium">Rules</label>

            {rulesField.state.value.map((_, index) => (
              <div key={index} className="flex items-start justify-between gap-3">
                <Card className="w-full">
                  <CardContent className="flex flex-col gap-3">
                    <form.Field name={`rules[${index}].selectors`}>
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <div className="flex flex-col gap-3">
                            <FieldLabel htmlFor="pageRule-rules-selectors">Selectors</FieldLabel>
                            <Textarea
                              id="pageRule-rules-selectors"
                              name={field.name}
                              value={Array.isArray(field.state.value) ? field.state.value.join('\n') : ''}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value.split(/\r?\n/).map((s) => s.trim()))}
                              aria-invalid={isInvalid}
                            />
                          </div>
                        )
                      }}
                    </form.Field>
                    <div className="flex flex-col gap-3 py-3">
                      <FieldLabel htmlFor="pageRule-rules-attribute">Attributes</FieldLabel>
                      <form.Field name={`rules[${index}].attrs`}>
                        {(attrsField) => (
                          <div id="pageRule-rules-attribute" className="flex flex-1 flex-col gap-3 space-y-2">
                            {attrsField.state.value &&
                              attrsField.state.value.map((attrObj, i) => (
                                <div key={i} className="flex items-start justify-between gap-3">
                                  <div className="flex w-1/2 flex-col gap-3">
                                    <form.Field
                                      name={`rules[${index}].attrs[${i}].name`}
                                      listeners={{
                                        onChange: ({ value }) => {
                                          return RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS.find(
                                            (r) => r.toString() === value,
                                          )
                                            ? form.setFieldValue(`rules[${index}].attrs[${i}].value`, 'true')
                                            : form.setFieldValue(`rules[${index}].attrs[${i}].value`, '')
                                        },
                                      }}
                                    >
                                      {(field) => (
                                        <Select
                                          value={field.state.value}
                                          onValueChange={(value) => field.handleChange(value as RuleAttrType)}
                                        >
                                          <SelectTrigger id="pageRule-rules-attribute-name" className="w-full">
                                            <SelectValue placeholder="Select rule" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {RULE_ATTR_TYPE_OPTIONS.map(({ value, label }) => (
                                              <SelectItem key={value} value={value}>
                                                {label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </form.Field>
                                  </div>

                                  {attrObj.name && (
                                    <div className="flex flex-col gap-3">
                                      <form.Field name={`rules[${index}].attrs[${i}].value`}>
                                        {(field) => (
                                          <Input
                                            id={`pageRule-rules[${index}]-attrs[${i}]-value`}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            placeholder={RULE_ATTR_TYPE_PLACEHOLDER_MAP[attrObj.name]}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            readOnly={
                                              !!RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS.find(
                                                (r) => r.toString() === attrObj.name,
                                              )
                                            }
                                          />
                                        )}
                                      </form.Field>
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      attrsField.handleChange((old) => old && old.filter((_, idx) => idx !== i))
                                    }
                                    className="self-center"
                                  >
                                    <X />
                                  </Button>
                                </div>
                              ))}

                            {/* ADD ATTR */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                attrsField.handleChange((old) => [...old, { name: '' as RuleAttrType, value: '' }])
                              }
                            >
                              <Plus /> Add attribute
                            </Button>
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </CardContent>
                </Card>

                {/* REMOVE RULE */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => rulesField.handleChange((old) => old.filter((_, i) => i !== index))}
                  className="self-center"
                >
                  <X />
                </Button>
              </div>
            ))}

            {/* ADD RULE */}
            <Button
              type="button"
              variant="outline"
              onClick={() => rulesField.handleChange((old) => [...old, { attrs: [], selectors: [] }])}
              className="ml-3"
            >
              <Plus /> Add Rules
            </Button>
          </div>
        )}
      </form.Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-3">
              <Spinner />
              {submitLabel}
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        <Link href={`/projects/${project.id}/page-rules`} className="cursor-pointer">
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>
    </form>
  )
}
