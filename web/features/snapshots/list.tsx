'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { builds } from '@/db/schema'
import { listSnapshotsByBuild, type SnapshotListItemRes } from '@/features/snapshots/actions'
import { SnapshotDiffBadge } from '@/features/snapshots/badge'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'

export function SnapshotListCard({ build }: { build: typeof builds.$inferSelect }) {
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination({
    defaultPageSize: 6,
  })
  const [pendingSearch, setPendingSearch] = useQueryState('search', parseAsString.withDefault(''))
  const search = useDebounce(pendingSearch, 300)

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_SNAPSHOTS, build.projectId, build.id, { page, pageSize, search }],
    queryFn: () => listSnapshotsByBuild({ buildId: build.id, page, pageSize, search }),
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
      <CardHeader className="gap-1">
        <InputGroup className="max-w-sm">
          <InputGroupInput
            placeholder="Search snapshots by page path..."
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
      </CardHeader>
      <CardContent className="">
        <div className="grid gap-4 pb-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && (
            <>
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </>
          )}
          {!isLoading &&
            table.getRowModel().rows?.length > 0 &&
            table.getRowModel().rows.map((row) => (
              <Link
                key={row.original.id}
                href={`/projects/${build.projectId}/builds/${build.id}/snapshots/${row.original.id}`}
                aria-label={`View ${row.original.pagePath}`}
              >
                <SnapshotItemCard snapshot={row.original} build={build} />
              </Link>
            ))}
          {!isLoading && table.getRowModel().rows?.length === 0 && (
            <div className="col-span-full py-8">
              <p className="text-muted-foreground text-center">No snapshots found.</p>
            </div>
          )}
        </div>
        <DataTablePagination table={table} pageSizeOptions={[6]} />
      </CardContent>
    </Card>
  )
}

export function SnapshotItemCard({
  snapshot,
  build,
}: {
  snapshot: SnapshotListItemRes
  build: typeof builds.$inferSelect
}) {
  return (
    <Card className="hover:border-primary pt-0 transition">
      <CardContent className="px-0">
        <div className="bg-muted/90 relative h-56 w-full shrink-0 overflow-hidden rounded-t-xl">
          {snapshot.screenshotMedia?.path ? (
            <>
              <Image src={snapshot.screenshotMedia.path} alt="" fill className="object-cover" unoptimized />
              <SnapshotDiffBadge diffPercentage={snapshot.diffPercentage} className="absolute top-3 right-3" />
            </>
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              Image not available
            </div>
          )}
        </div>
      </CardContent>
      <CardHeader>
        <CardTitle className="truncate">Page path {snapshot.pagePath}</CardTitle>
        <CardDescription className="truncate">
          Page full URL {new URL(snapshot.pagePath, build.baseUrl).toString()}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
