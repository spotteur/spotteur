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
import { QUERY_KEY_PAGE_RULES, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { manageRule } from '@/features/page-rules/actions'
import PageRuleForm, { type PageRuleFormInput } from '@/features/page-rules/form'
import { getProject } from '@/features/projects/actions'
import { type NavigationType } from '@/types/app'

export default function ManagePageRule() {
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<PageRuleFormInput> | undefined>(undefined)
  const params = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const mutation = useMutation({
    mutationFn: async (values: PageRuleFormInput) => manageRule(values, data ? data.id : ''),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Page Rule managed', { description: 'Your rule was successfully managed.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES] })
      } else {
        setFormErrors(res.error)
        toast.error('Rule management failed', { description: 'Please review the error and try again.' })
      }
    },
    onError: (error) => {
      console.error('Rule management error:', error)
      toast.error('Rule management failed', {
        description: 'Something went wrong. Please try again later.',
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
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}`}>{data.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}/page-rules`}>Page Rules</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Manage</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [data, params.id],
  )
  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  const navigations = useMemo<NavigationType[]>(() => projectsMenu(params.id), [params.id])
  useHeaderNavigations(navigations)
  if (!isLoading && !data) {
    notFound()
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">Manage Page Rule</h1>
      {data && (
        <Card className="w-full">
          <CardContent className="max-w-2xl">
            <PageRuleForm
              defaultValues={{
                viewports: data.viewports,
                snapshotBrowsers: data.snapshotBrowsers,
                pagePath: '',
                mediaReset: true,
                reducedMotion: true,
                rules: [],
                hookAfterPageLoad: '',
                hookBeforeScreenshot: '',
              }}
              onSubmit={(values) => mutation.mutate(values)}
              submitLabel="Save"
              isSubmitting={mutation.isPending}
              errors={formErrors}
              project={data}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
