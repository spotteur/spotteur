'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { projectsMenu } from '@/constants/app'
import { QUERY_KEY_PAGE_RULES, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { deletePageRule } from '@/features/page-rules/actions'
import { ConfirmDeletePageRuletDialog } from '@/features/page-rules/confirm-delete-dialog'
import { PageRuleListCard } from '@/features/page-rules/list'
import { getProject } from '@/features/projects/actions'
import { type NavigationType } from '@/types/app'

export default function ProjectPageRulesPage() {
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; path: string } | null>(null)
  const params = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const mutation = useMutation({
    mutationFn: (id: string) => deletePageRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES] })
      toast.success('Page rule deleted', { description: 'The page rule was successfully deleted.' })
    },
    onError: () => {
      toast.error('Page rule deletion failed', { description: 'Something went wrong. Please try again later.' })
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
            <BreadcrumbPage>Page Rules</BreadcrumbPage>
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
    <div className="space-y-4 p-4">
      <PageRuleListCard projectId={data?.id} onRequestDelete={(val) => setPendingDelete(val)} />
      <ConfirmDeletePageRuletDialog
        open={!!pendingDelete}
        pathRule={pendingDelete?.path ?? ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            mutation.mutate(pendingDelete.id)
            setPendingDelete(null)
          }
        }}
      />
    </div>
  )
}
