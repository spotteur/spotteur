'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Cog, Edit, MoreHorizontal, Trash, Workflow } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type projects } from '@/db/schema'

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
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${id}`}>
                <Edit />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${id}/pages`}>
                    <Cog />
                    Pages
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${id}/builds`}>
                    <Workflow />
                    Builds
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRequestDelete({ id, name })
                  }}
                >
                  <Trash />
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
