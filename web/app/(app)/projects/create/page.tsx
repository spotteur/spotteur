'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_SNAPSHOTS_BROWSER,
  DEFAULT_SNAPSHOTS_HEIGHT,
  DEFAULT_SNAPSHOTS_WIDTH,
  defaultMenu,
  VALIDATION_ERROR_DESCRIPTION,
} from '@/constants/app'
import { listProjectsQueryKey } from '@/constants/query-keys'
import { createProject } from '@/features/projects/actions'
import { ProjectForm, type ProjectFormInput } from '@/features/projects/form'
import { type NavigationType } from '@/types/app'

export default function NewProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<ProjectFormInput> | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormInput) => createProject(values),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Project created', { description: 'Your project was successfully created.' })
        queryClient.invalidateQueries({ queryKey: listProjectsQueryKey() })
        router.push(`/projects/${res.data.id}`)
        return
      }

      setFormErrors(res.error)
      toast.error('Project creation failed', { description: VALIDATION_ERROR_DESCRIPTION })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, {
        description: DEFAULT_ERROR_DESCRIPTION,
      })
    },
  })

  const breadcrumbs = useMemo(
    () => (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/projects">Projects</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Create</BreadcrumbPage>
        </BreadcrumbItem>
      </>
    ),
    [],
  )
  useHeaderBreadcrumbs(breadcrumbs, false)
  const navigations = useMemo<NavigationType[]>(() => defaultMenu(), [])
  useHeaderNavigations(navigations)

  return (
    <div className="max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Create Project</h1>
      <ProjectForm
        defaultValues={{
          name: '',
          baseUrl: '',
          diffTolerancePercentage: 0.01,
          snapshotBrowsers: [DEFAULT_SNAPSHOTS_BROWSER],
          viewports: [[DEFAULT_SNAPSHOTS_WIDTH, DEFAULT_SNAPSHOTS_HEIGHT]],
          pagePaths: '',
          token: '',
        }}
        onSubmit={(values) => mutation.mutate(values)}
        submitLabel="Create"
        isCreate={true}
        isSubmitting={mutation.isPending}
        errors={formErrors}
      />
    </div>
  )
}
