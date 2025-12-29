'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'

import { TableSkeleton } from '@/components/table-skeleton'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { deleteProject, listProjects } from '@/features/projects/actions'
import { getColumns } from '@/features/projects/columns'
import { ConfirmDeleteProjectDialog } from '@/features/projects/confirm-delete-dialog'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination()
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
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setPendingSearch(value)
      resetPagination()
    },
    [setPendingSearch, resetPagination],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Skeleton className="h-10 w-full max-w-sm rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>

        <div className="border rounded-lg">
          <TableSkeleton rows={5} columns={6} />
        </div>

        <Skeleton className="h-4 w-40 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <InputGroup className="max-w-sm">
            <InputGroupInput
              placeholder="Search by project name"
              value={pendingSearch}
              type="search"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Link href="/projects/create">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </Link>
      </div>

      <DataTable
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        columns={columns}
        data={data?.data ?? []}
        rowCount={data?.total ?? 0}
      />

      <ConfirmDeleteProjectDialog
        open={!!pendingDelete}
        projectName={pendingDelete?.name ?? ''}
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
