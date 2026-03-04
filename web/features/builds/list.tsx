'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Layers, Play, Search, X } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGE_SIZE_OPTIONS } from '@/constants/app'
import { QUERY_KEY_BUILDS } from '@/constants/query-keys'
import { type builds } from '@/db/schema'
import { listBuildsByProject } from '@/features/builds/actions'
import { BuildStatusBadge } from '@/features/builds/badge'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateTime } from '@/lib/utils'

import { TriggerBuildDialog } from './trigger-build-dialog'

export function BuildListCard({ projectId, baseUrl }: { projectId?: string; baseUrl?: string }) {
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination({
    defaultPageSize: 6,
  })
  const [pendingSearch, setPendingSearch] = useQueryState('search', parseAsString.withDefault(''))
  const search = useDebounce(pendingSearch, 300)

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_BUILDS, projectId, { page, pageSize, search }],
    queryFn: () => listBuildsByProject({ projectId: projectId || '', page, pageSize, search }),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.data ?? [],
    columns: [],
    rowCount: data?.total ?? 0,
    manualPagination: true,
    state: {
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange,
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
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <CardAction className="flex flex-row items-center justify-end gap-2 pb-0">
          {projectId && baseUrl ? (
            <TriggerBuildDialog projectId={projectId} baseUrl={baseUrl}>
              <Button size="sm">
                <Play /> Create new build
              </Button>
            </TriggerBuildDialog>
          ) : (
            <Skeleton className="h-8 w-32" />
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {!projectId || isLoading ? (
          <BuildListSkeleton />
        ) : (
          <>
            <div className="grid gap-4 pb-6 md:grid-cols-2 xl:grid-cols-3">
              {data?.data?.map((build) => {
                return (
                  <Link key={build.id} href={`/projects/${projectId}/builds/${build.id}/snapshots` as Route}>
                    <BuildItemCard build={build} />
                  </Link>
                )
              })}
            </div>
            <DataTablePagination table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function BuildItemCard({ build }: { build: typeof builds.$inferSelect }) {
  return (
    <Card className="hover:border-primary h-full transition">
      <CardHeader className="flex items-start justify-between gap-3">
        <CardTitle className="line-clamp-2 text-lg">{build.identifier}</CardTitle>
        <BuildStatusBadge status={build.status} />
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Layers className="size-4" />
          <span>{build.pagePaths?.length ?? 0} pages</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-foreground">Created {formatDateTime(build.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function BuildListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="h-full">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-16 w-5/8" />
              <Skeleton className="h-6 w-2/8" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
