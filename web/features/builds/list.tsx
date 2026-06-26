'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Play, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback } from 'react'

import { TableSkeleton } from '@/components/table-skeleton'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { listBuildsByProjectQueryKey } from '@/constants/query-keys'
import { listBuildsByProject } from '@/features/builds/actions'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'

import { getColumns } from './columns'
import { TriggerBuildDialog } from './trigger-build-dialog'

const columns = getColumns()

export function BuildListCard({ projectId, projectBaseUrl }: { projectId?: string; projectBaseUrl?: string }) {
  const router = useRouter()
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination({
    defaultPageSize: 15,
  })
  const [pendingSearch, setPendingSearch] = useQueryState('search', parseAsString.withDefault(''))
  const search = useDebounce(pendingSearch, 300)

  const { data, isLoading } = useQuery({
    queryKey: listBuildsByProjectQueryKey(projectId || '', { page, pageSize, search }),
    queryFn: () => listBuildsByProject({ projectId: projectId || '', page, pageSize, search }),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  })

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
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <InputGroup className="max-w-sm flex-1">
            <InputGroupInput
              placeholder="Search builds by identifier..."
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

        {projectId && projectBaseUrl ? (
          <TriggerBuildDialog projectId={projectId} baseUrl={projectBaseUrl}>
            <Button size="sm">
              <Play /> Trigger Build
            </Button>
          </TriggerBuildDialog>
        ) : (
          <Skeleton className="h-8 w-32" />
        )}
      </div>

      {!projectId || isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <DataTable
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          columns={columns}
          data={data?.data ?? []}
          rowCount={data?.total ?? 0}
          onRowClick={(row) => router.push(`/builds/${row.id}/snapshots`)}
          pageSizeOptions={[15, 30, 60]}
        />
      )}
    </>
  )
}
