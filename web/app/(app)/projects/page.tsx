'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { TableSkeleton } from '@/components/table-skeleton'
import { BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { DEFAULT_ERROR_DESCRIPTION, defaultMenu } from '@/constants/app'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { deleteProject, listProjects } from '@/features/projects/actions'
import { getColumns } from '@/features/projects/columns'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { type NavigationType } from '@/types/app'

export default function ProjectsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination({ defaultPageSize: 10 })
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  const columns = useMemo(
    () =>
      getColumns(({ id, name }) => {
        setPendingDelete({ id, name })
      }),
    [],
  )

  const [pendingSearch, setPendingSearch] = useQueryState('search', parseAsString.withDefault(''))
  const search = useDebounce(pendingSearch)

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, { page, pageSize, search }],
    queryFn: () => listProjects({ page, pageSize, search }),
    placeholderData: keepPreviousData,
  })

  const mutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PROJECTS] })
      toast.success('Project deleted', { description: 'The project was successfully deleted.' })
    },
    onError: (error) => {
      console.error(error)
      toast.error('Project deletion failed', { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  const breadcrumbs = useMemo(
    () => (
      <>
        <BreadcrumbItem>
          <BreadcrumbPage>Projects</BreadcrumbPage>
        </BreadcrumbItem>
      </>
    ),
    [],
  )
  useHeaderBreadcrumbs(breadcrumbs, false)
  const navigations = useMemo<NavigationType[]>(() => defaultMenu(), [])
  useHeaderNavigations(navigations)

  const handleSearchChange = useCallback(
    (value: string) => {
      setPendingSearch(value)
      resetPagination()
    },
    [setPendingSearch, resetPagination],
  )

  const handleClearSearch = useCallback(() => {
    setPendingSearch('')
    resetPagination()
  }, [setPendingSearch, resetPagination])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <InputGroup className="max-w-sm">
            <InputGroupInput
              placeholder="Search by project name"
              value={pendingSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            {pendingSearch && (
              <InputGroupAddon onClick={handleClearSearch} className="cursor-pointer" align="inline-end">
                <X />
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <Button size="sm" asChild>
          <Link href="/projects/create">
            <Plus />
            Create Project
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <DataTable
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.total ?? 0}
          onRowClick={(row) => router.push(`/projects/${row.id}`)}
          pageSizeOptions={[10, 25, 50]}
        />
      )}

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        valueToMatch={pendingDelete?.name ?? ''}
        title="Delete Project"
        instruction="Type the project name to confirm"
        confirmButtonText="Delete Project"
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
