'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Logs, Wallpaper } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { type builds } from '@/db/schema'
import { formatDateTime } from '@/lib/utils'

import { BuildStatusBadge } from './badge'

export function getColumns(): ColumnDef<typeof builds.$inferSelect>[] {
  return [
    {
      id: 'identifier',
      accessorKey: 'identifier',
      header: 'Identifier',
    },
    {
      id: 'baseUrl',
      accessorKey: 'baseUrl',
      header: 'Base URL',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <BuildStatusBadge status={row.original.status} />,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: 'action',
      header: '',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/builds/${row.original.id}/snapshots`}>
                <Wallpaper />
                Snapshots
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/builds/${row.original.id}/logs`}>
                <Logs />
                Logs
              </Link>
            </Button>
          </div>
        )
      },
    },
  ]
}
