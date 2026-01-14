'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { type projects } from '@/db/schema/project'

export function getColumns(
  onRequestDelete: (payload: { id: string; name: string }) => void,
): ColumnDef<typeof projects.$inferSelect>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
    },
    {
      id: 'baseUrl',
      accessorKey: 'baseUrl',
      header: 'Base URL',
    },
    {
      id: 'snapshotBrowsers',
      accessorKey: 'snapshotBrowsers',
      header: 'Browser',
      cell: ({ row }) => {
        return row.original.snapshotBrowsers.join(', ')
      },
    },
    {
      id: 'action',
      header: '',
      cell: ({ row }) => {
        const id = row.original.id
        const name = row.original.name
        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/projects/${id}`} className="cursor-pointer">
              <Button variant="ghost" size="sm">
                <Eye className="size-4" />
                View
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRequestDelete({ id, name })} variant="destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
