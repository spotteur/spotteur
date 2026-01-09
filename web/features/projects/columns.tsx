'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { projects } from '@/db/schema/project'

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
      id: 'snapshotBrowser',
      accessorKey: 'snapshotBrowser',
      header: 'Browser',
    },
    {
      id: 'snapshotViewport',
      accessorKey: 'snapshotWidth',
      header: 'Viewport (in px)',
      cell: ({ row }) => {
        const width = row.original.snapshotWidth
        const height = row.original.snapshotHeight
        return (
          <span>
            {width} x {height}
          </span>
        )
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
