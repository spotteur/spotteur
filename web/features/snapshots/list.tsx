'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Check, ChevronsUpDown, Globe, LinkIcon, Proportions, Search, X } from 'lucide-react'
import { type Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGE_SIZE_OPTIONS } from '@/constants/app'
import { BROWSER_LABEL_MAP } from '@/constants/enum'
import { QUERY_KEY_SNAPSHOTS } from '@/constants/query-keys'
import { BuildStatus, SNAPSHOT_APPROVAL_STATUS_OPTIONS } from '@/constants/status-map'
import { type builds } from '@/db/schema'
import { listSnapshotsByBuild, type SnapshotListItemRes } from '@/features/snapshots/actions'
import { SnapshotApprovalStatusBadge, SnapshotDiffBadge } from '@/features/snapshots/badge'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'

export function SnapshotListCard({ build }: { build?: typeof builds.$inferSelect | null }) {
  const { page, pageSize, pagination, resetPagination, onPaginationChange } = usePagination({
    defaultPageSize: 6,
  })
  const [isApprovalStatusFilterOpen, setIsApprovalStatusFilterOpen] = useState(false)
  const [pendingSearch, setPendingSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [approvalStatus, setApprovalStatus] = useQueryState('status', parseAsString.withDefault(''))
  const search = useDebounce(pendingSearch, 300)

  const { data, isLoading: isLoadingSnapshots } = useQuery({
    queryKey: [QUERY_KEY_SNAPSHOTS, build?.projectId, build?.id, { page, pageSize, search, approvalStatus }],
    queryFn: () => listSnapshotsByBuild({ buildId: build?.id || '', page, pageSize, search, approvalStatus }),
    placeholderData: keepPreviousData,
    refetchInterval: () => {
      const buildStatus = build?.status
      if (buildStatus === BuildStatus.PENDING || buildStatus === BuildStatus.IN_PROGRESS) {
        return 10_000
      }

      return false
    },
    enabled: !!build?.id && !!build?.projectId,
  })

  const isLoading = !build || isLoadingSnapshots

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

  const handleApprovalStatusChange = useCallback(
    (value: string) => {
      setApprovalStatus((prev) => (prev === value ? '' : value))
      setIsApprovalStatusFilterOpen(false)
      resetPagination()
    },
    [setApprovalStatus, setIsApprovalStatusFilterOpen, resetPagination],
  )

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="max-w-sm flex-1">
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
          <Popover open={isApprovalStatusFilterOpen} onOpenChange={setIsApprovalStatusFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isApprovalStatusFilterOpen}
                className="w-50 justify-between"
              >
                {approvalStatus
                  ? SNAPSHOT_APPROVAL_STATUS_OPTIONS.find((status) => status.value === approvalStatus)?.label
                  : 'All statuses'}
                <ChevronsUpDown className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-50 p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {SNAPSHOT_APPROVAL_STATUS_OPTIONS.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(value) => handleApprovalStatusChange(value)}
                      >
                        {status.label}
                        <Check
                          className={cn('ml-auto', approvalStatus === status.value ? 'opacity-100' : 'opacity-0')}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 pb-6 md:grid-cols-2 xl:grid-cols-3">
          {(isLoading || !build) && (
            <>
              <Skeleton className="h-79.5 w-full" />
              <Skeleton className="h-79.5 w-full" />
              <Skeleton className="h-79.5 w-full" />
            </>
          )}
          {!isLoading &&
            build &&
            table.getRowModel().rows?.length > 0 &&
            table.getRowModel().rows.map((row) => (
              <Link
                key={row.original.id}
                href={`/projects/${build.projectId}/builds/${build.id}/snapshots/${row.original.id}` as Route}
                aria-label={`View ${row.original.pagePath}`}
              >
                <SnapshotItemCard snapshot={row.original} build={build} />
              </Link>
            ))}
          {!isLoading && build && table.getRowModel().rows?.length === 0 && (
            <div className="col-span-full py-8">
              <p className="text-muted-foreground text-center">No snapshots found.</p>
            </div>
          )}
        </div>
        <DataTablePagination table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} />
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
          {snapshot.screenshotMedia ? (
            <>
              <Image src={snapshot.screenshotMedia.path} alt="" fill className="object-cover object-top-left" />
              <div className="absolute top-3 right-3 space-x-2">
                <SnapshotApprovalStatusBadge status={snapshot.approvalStatus} />
                <SnapshotDiffBadge diffPercentage={snapshot.diffPercentage} />
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              Image not available
            </div>
          )}
        </div>
      </CardContent>
      <CardHeader>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">{BROWSER_LABEL_MAP[snapshot.browser]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Proportions className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">
              {snapshot.viewportWidth} x {snapshot.viewportHeight}
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <LinkIcon className="text-muted-foreground h-4 w-4" />
            <span className="font-medium">{new URL(snapshot.pagePath, build.baseUrl).toString()}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
