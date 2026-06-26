'use client'

import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback } from 'react'

import { TableSkeleton } from '@/components/table-skeleton'
import { DataTable } from '@/components/ui/data-table'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { listBuildLogsQueryKey } from '@/constants/query-keys'
import { getBuildLogs } from '@/features/builds/actions'
import { getColumns } from '@/features/logs/columns'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'

export default function BuildListLog({ buildId }: { buildId: string }) {
  const columns = getColumns()
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination({ defaultPageSize: 25 })
  const [pendingSearch, setPendingSearch] = useQueryState('search', parseAsString.withDefault(''))
  const search = useDebounce(pendingSearch)
  const { data: logs, isLoading } = useQuery({
    queryKey: listBuildLogsQueryKey(buildId, { page, pageSize, search }),
    queryFn: () => getBuildLogs({ buildId, page, pageSize, search }),
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
    <div className="space-y-4 p-4">
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <div className="flex flex-col gap-5">
          <InputGroup className="max-w-sm flex-1">
            <InputGroupInput
              placeholder="Search by Snapshot ID"
              value={pendingSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            {pendingSearch && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={handleClearSearch}>
                  <span className="sr-only">Clear search</span>
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <DataTable
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            columns={columns}
            data={logs?.data ?? []}
            rowCount={logs?.total ?? 0}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  )
}
