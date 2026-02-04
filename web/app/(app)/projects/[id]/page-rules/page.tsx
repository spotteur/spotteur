'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { projectsMenu } from '@/constants/app'
import { QUERY_KEY_PAGE_RULES, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { deletePageRule, existingPageRules, upsertPageRules } from '@/features/page-rules/actions'
import { ConfirmDeletePageRuletDialog } from '@/features/page-rules/confirm-delete-dialog'
import { PageRuleListCard } from '@/features/page-rules/list'
import { getProject } from '@/features/projects/actions'
import { type NavigationType } from '@/types/app'
import { BulkEditDialog } from '@/features/page-rules/bulk-edit-dialog'

export default function ProjectPageRulesPage() {
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; path: string } | null>(null)
  const [openBulkEdit, setOpenBulkEdit] = useState<boolean>(false)
  const [pendingUpdate, setPendingUpdate] = useState<string>('')
  const params = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const {data: existingPageRulesData} = useQuery({
    queryKey: [QUERY_KEY_PAGE_RULES, params.id, 'existing'],
    queryFn: () => existingPageRules(),
    enabled: !!params.id,
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

  const importMutation = useMutation({
    mutationFn: (schema: string) => upsertPageRules(schema, params.id),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES, params.id] })
        toast.success('Page rules updated', { description: 'The page rules were successfully updated.' })
        setOpenBulkEdit(false)
      } else {
        toast.error('Page rules update failed', { description: (
           <ul>
            {res.error && Object.values(res.error.fieldErrors).map((row, index) => {
              console.log(row)
              return (
                <li key={index}>
                  {row && Array.isArray(row) ? (
                    row.map((message, i) => <p key={i}>{index + 1} - {message}</p>)
                  ) : row}
                </li>
              )
            })}
          </ul>
        ) })
      }
    },
    onError: () => {
      toast.error('Page rules update failed', { description: 'Something went wrong. Please try again later.' })
    },
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await existingPageRules()

      return res
    },
    onSuccess: (response) => {
      const blob = new Blob([response], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'page-rules.yaml'
      a.click()

      URL.revokeObjectURL(url)
      toast.success('Page rules exported', { description: 'The page rules were successfully exported.' })
    },
    onError: () => {
      toast.error('Page rules export failed', { description: 'Something went wrong. Please try again later.' })
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
      <div className="flex justify-end gap-3">
        <Button type="button" variant="default" onClick={() => setOpenBulkEdit(true)}>
          <Edit />
          Bulk Edit
        </Button>
      </div>
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

      {openBulkEdit && (
        <BulkEditDialog
          open={openBulkEdit}
          codeYaml={existingPageRulesData || pendingUpdate}
          onImport={(code) => {
            if (code) {
              setPendingUpdate(code)
              importMutation.mutate(code)
            }
          }}
          onCancel={() => setOpenBulkEdit(false)}
        />
      )}
    </div>
  )
}
