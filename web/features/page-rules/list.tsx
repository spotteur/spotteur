'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Globe, MoreHorizontal, Settings } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { EmptySection } from '@/components/empty-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGE_SIZE_OPTIONS } from '@/constants/app'
import { QUERY_KEY_PAGE_RULES } from '@/constants/query-keys'
import { type pageRules } from '@/db/schema'
import { listPageRulesByProject } from '@/features/page-rules/actions'
import { usePagination } from '@/hooks/use-pagination'
import { formatDateTime } from '@/lib/utils'

export function PageRuleListCard({
  projectId,
  onRequestDelete,
}: {
  projectId?: string
  onRequestDelete: (payload: { id: string; path: string }) => void
}) {
  const { page, pageSize, pagination, onPaginationChange } = usePagination({
    defaultPageSize: 6,
  })
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PAGE_RULES, projectId, page],
    queryFn: () => listPageRulesByProject({ projectId: projectId!, pageSize, page }),
    enabled: !!projectId,
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-end gap-2 pb-0">
        {projectId ? (
          data &&
          data.data.length > 0 && (
            <Link href={`/projects/${projectId}/page-rules/manage` as Route} className="cursor-pointer">
              <Button size="sm" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Button>
            </Link>
          )
        ) : (
          <Skeleton className="h-8 w-32" />
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {!projectId || isLoading ? (
          <PageRuleListSkeleton />
        ) : table && table.getRowModel().rows?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {table.getRowModel().rows.map((row) => {
              return <PageRuleItemCard rule={row.original} onRequestDelete={onRequestDelete} key={row.original.id} />
            })}
          </div>
        ) : (
          <EmptySection
            url={`/projects/${projectId}/page-rules/create` as Route}
            label="Add page rule"
            title="Page rule"
          />
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <DataTablePagination table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} />
      </CardFooter>
    </Card>
  )
}

export function PageRuleItemCard({
  rule,
  onRequestDelete,
}: {
  rule: typeof pageRules.$inferSelect
  onRequestDelete: (payload: { id: string; path: string }) => void
}) {
  return (
    <>
      <Card className="hover:border-primary h-full transition">
        <Link href={`/projects/${rule.projectId}/page-rules/manage?id=${rule.id}` as Route}>
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="word-wrap w-full text-lg font-semibold">{rule.pagePath}</CardTitle>
              <div className="flex items-center justify-end gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        onRequestDelete({ id: rule.id, path: rule.pagePath })
                      }}
                      variant="destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="size-4" />
              <span>{rule.snapshotBrowsers.join(', ')}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-foreground">Created {formatDateTime(rule.createdAt)}</span>
            </div>
          </CardContent>
        </Link>
      </Card>
    </>
  )
}

function PageRuleListSkeleton() {
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
