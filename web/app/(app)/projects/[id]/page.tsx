'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { projectsMenu } from '@/constants/app'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE, VALIDATION_ERROR_DESCRIPTION } from '@/constants/app'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { getProject, updateProject } from '@/features/projects/actions'
import { ProjectForm, type ProjectFormInput } from '@/features/projects/form'
import { ProjectFormSkeleton } from '@/features/projects/form-skeleton'
import { type NavigationType } from '@/lib/type/app'

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

  const navigations = useMemo<NavigationType[]>(() => projectsMenu(params.id), [params.id])
  useHeaderNavigations(navigations)

  if (!isLoading && !data) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
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
                snapshotBrowsers: data.snapshotBrowsers as ProjectFormInput['snapshotBrowsers'],
                snapshotSelector: data.snapshotSelector,
                viewports: data.viewports,
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
