'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Route } from 'next'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { useHeaderBreadcrumbs } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE, VALIDATION_ERROR_DESCRIPTION } from '@/constants/app'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { getProject, updateProject } from '@/features/projects/actions'
import { ProjectForm, type ProjectFormInput } from '@/features/projects/form'
import { ProjectFormSkeleton } from '@/features/projects/form-skeleton'

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<ProjectFormInput> | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormInput) => updateProject(values),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Project updated', { description: 'Your changes were successfully saved.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PROJECTS] })
      } else {
        setFormErrors(res.error)
        toast.error('Project update failed', { description: VALIDATION_ERROR_DESCRIPTION })
      }
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, {
        description: DEFAULT_ERROR_DESCRIPTION,
      })
    },
  })

  const breadcrumbs = useMemo(
    () =>
      data ? (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/projects">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [data],
  )

  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  if (!isLoading && !data) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2 border-b">
        <Button variant="ghost" asChild className="border-primary rounded-none border-b-2">
          <Link href={`/projects/${params.id}`}>General</Link>
        </Button>
        <Button variant="ghost" asChild className="rounded-none border-b-2 border-transparent">
          <Link href={`/projects/${params.id}/page-rules` as Route}>Page Rules</Link>
        </Button>
        <Button variant="ghost" asChild className="rounded-none border-b-2 border-transparent">
          <Link href={`/projects/${params.id}/builds` as Route}>Builds</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="max-w-2xl">
          {isLoading || !data ? (
            <ProjectFormSkeleton />
          ) : (
            <ProjectForm
              key={data.id}
              defaultValues={{
                id: data.id,
                name: data.name,
                baseUrl: data.baseUrl,
                snapshotBrowser: data.snapshotBrowser as ProjectFormInput['snapshotBrowser'],
                snapshotSelector: data.snapshotSelector,
                snapshotWidth: data.snapshotWidth,
                snapshotHeight: data.snapshotHeight,
                pagePaths: Array.isArray(data.pagePaths) ? data.pagePaths : [],
                token: data.token ?? '',
              }}
              onSubmit={(values) => mutation.mutate(values as ProjectFormInput)}
              submitLabel="Update"
              isSubmitting={mutation.isPending}
              errors={formErrors}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
