'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { useHeaderBreadcrumbs } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { QUERY_KEY_PAGE_RULES } from '@/constants/query-keys'
import { getRule, updateRule } from '@/features/page-rules/actions'
import PageRuleForm, { PageRuleFormInput } from '@/features/page-rules/form'

export default function EditRulePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<PageRuleFormInput> | undefined>(undefined)
  const params = useParams<{ id: string; ruleId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PAGE_RULES, params.ruleId],
    queryFn: () => getRule(params.ruleId),
  })

  const mutation = useMutation({
    mutationFn: async (values: PageRuleFormInput) => updateRule(values, params.ruleId, params.id),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Page Rule updated', { description: 'Your rule was successfully saved.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES] })
        router.push(`/projects/${params.id}/page-rules`)
      } else {
        setFormErrors(res.error)
        toast.error('Rule update failed', { description: 'Please review the error and try again.' })
      }
    },
    onError: (error) => {
      console.error('Rule update error:', error)
      toast.error('Rule update failed', {
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
              <Link href={`/projects/${params.id}`}>{data.project.name}</Link>
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
            <BreadcrumbPage>{params.ruleId}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [data, params.id, params.ruleId],
  )
  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  if (!isLoading && !data) {
    notFound()
  }

  return (
    <Card>
      <CardContent>
        <div className="max-w-2xl">
          {data && (
            <PageRuleForm
              key={data.rule.id}
              defaultValues={{
                viewports: data.rule.viewports,
                snapshotBrowsers: data.rule.snapshotBrowsers,
                pagePath: data.rule.pagePath,
                rules: data.rule.rules,
                mediaReset: data.rule.mediaReset,
                reducedMotion: data.rule.reducedMotion,
              }}
              onSubmit={(values) => {
                console.log('values', values)
                return mutation.mutate(values as PageRuleFormInput)
              }}
              submitLabel="Update"
              isSubmitting={mutation.isPending}
              errors={formErrors}
              project={data.project}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
