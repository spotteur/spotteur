'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { useHeaderBreadcrumbs } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE, VALIDATION_ERROR_DESCRIPTION } from '@/constants/app'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { createProject } from '@/features/projects/actions'
import { ProjectForm, type ProjectFormInput } from '@/features/projects/form'

const DEFAULT_SNAPSHOT_BROWSER = 'chrome'
const DEFAULT_SNAPSHOT_SELECTOR = 'body'
const DEFAULT_SNAPSHOT_WIDTH = 1024
const DEFAULT_SNAPSHOT_HEIGHT = 768

export default function NewProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<ProjectFormInput> | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormInput) => createProject(values),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Project created', { description: 'Your project was successfully created.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PROJECTS] })
        router.push('/projects')
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
  useHeaderBreadcrumbs(breadcrumbs)

  return (
    <div className="max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Create Project</h1>
      <ProjectForm
        defaultValues={{
          name: '',
          baseUrl: '',
          snapshotBrowser: DEFAULT_SNAPSHOT_BROWSER,
          snapshotSelector: DEFAULT_SNAPSHOT_SELECTOR,
          snapshotWidth: DEFAULT_SNAPSHOT_WIDTH,
          snapshotHeight: DEFAULT_SNAPSHOT_HEIGHT,
          pagePaths: [],
          token: '',
        }}
        onSubmit={(values) => mutation.mutate(values)}
        submitLabel="Create"
        isSubmitting={mutation.isPending}
        errors={formErrors}
      />
    </div>
  )
}
