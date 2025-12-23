'use client'

import { useForm } from '@tanstack/react-form'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'

import { SpinnerComponent } from '@/components/spinner/SpinnerComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { sample } from '@/db/schema/sample'
import { selectById, update } from '@/lib/query/sample/query'

const formSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.')
    .max(100, 'Description must be at most 100 characters.'),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export default function SamplePageUpdate() {
  const [loading, setLoading] = useState<boolean>(false)
  const [initialData, setInitialData] = useState<typeof sample.$inferSelect>()
  const params = useParams<{ id: string }>()
  const id = params.id

  useEffect(() => {
    const process = async () => {
      const result = await selectById(id)

      if (result) {
        setInitialData(result)
      }
    }
    process()
  }, [id])

  const form = useForm({
    defaultValues: initialData ?? {
      name: '',
      description: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }: { value: typeof sample.$inferInsert }) => {
      setLoading(true)
      const result = await update({ data: value, id })

      if (result) {
        setInitialData(result)
        toast.success('Changes saved successfully.')
      }
      setLoading(false)
    },
  })

  if (!initialData) return <></>

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Page Sample Create</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="sample-create-page"
          className="cursor-pointer"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Put the name..."
                        className="min-h-24 resize-none"
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="description">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Put the description..."
                        rows={6}
                        className="min-h-24 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums"></InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Include steps to reproduce, expected behavior, and what actually happened.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="sample-create-page" className="cursor-pointer" disabled={loading}>
            {loading ? <SpinnerComponent /> : 'Submit'}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
