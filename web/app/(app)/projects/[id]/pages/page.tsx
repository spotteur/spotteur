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
import { deletePageRule, existingPageRules, upsertPageRules } from '@/features/page-rules/actions'
import { BulkEditPageRulesDialog } from '@/features/page-rules/bulk-edit-page-rules-dialog'
import { ConfirmDeletePageDialog } from '@/features/page-rules/confirm-delete-path-dialog'
import { PageListCard } from '@/features/page-rules/list'
import { getProject } from '@/features/projects/actions'
import { type NavigationType } from '@/types/app'

export default function ManagePagesPage() {
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; path: string } | null>(null)
  const [openBulkEdit, setOpenBulkEdit] = useState<boolean>(false)
  const [pendingUpdate, setPendingUpdate] = useState<string>('')
  const params = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const { data: existingPagesData } = useQuery({
    queryKey: [QUERY_KEY_PAGE_RULES, params.id, 'existing'],
    queryFn: () => existingPageRules(params.id),
    enabled: !!params.id,
  })

  const mutation = useMutation({
    mutationFn: (id: string) => deletePageRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES] })
      toast.success('Page deleted', { description: 'The page was successfully deleted.' })
    },
    onError: () => {
      toast.error('Failed to delete page', { description: 'Something went wrong. Please try again later.' })
    },
  })

  const importMutation = useMutation({
    mutationFn: (schema: string) => upsertPageRules(schema, params.id),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES, params.id] })
        toast.success('Pages updated', { description: 'Pages were successfully updated.' })
        setOpenBulkEdit(false)
      } else {
        toast.error('Failed to update pages', {
          description: (
            <ul>
              {res.error &&
                Object.values(res.error.fieldErrors).map((row, index) => {
                  return (
                    <li key={index}>
                      {row && Array.isArray(row)
                        ? row.map((message, i) => (
                            <p key={i}>
                              {index + 1} - {message}
                            </p>
                          ))
                        : row}
                    </li>
                  )
                })}
            </ul>
          ),
        })
      }
    },
    onError: () => {
      toast.error('Failed to update pages', { description: 'Something went wrong. Please try again later.' })
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
            <BreadcrumbPage>Pages</BreadcrumbPage>
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
      <PageListCard
        projectId={data?.id}
        onRequestDelete={(val) => setPendingDelete(val)}
        onBulkEditTrigger={() => setOpenBulkEdit(true)}
      />
      <ConfirmDeletePageDialog
        open={!!pendingDelete}
        pagePath={pendingDelete?.path ?? ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            mutation.mutate(pendingDelete.id)
            setPendingDelete(null)
          }
        }}
      />

      <BulkEditPageRulesDialog
        open={openBulkEdit}
        codeYaml={existingPagesData || pendingUpdate}
        onImport={(code) => {
          if (code) {
            setPendingUpdate(code)
            importMutation.mutate(code)
          }
        }}
        onCancel={() => setOpenBulkEdit(false)}
      />
    </div>
  )
}
