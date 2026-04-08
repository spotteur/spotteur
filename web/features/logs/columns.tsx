import { type ColumnDef } from '@tanstack/react-table'

import { LOGS_LEVEL } from '@/constants/enum'
import { type buildLogs } from '@/db/schema'
import { cn, formatDateTime } from '@/lib/utils'

export function getColumns(): ColumnDef<typeof buildLogs.$inferSelect>[] {
  return [
    {
      id: 'no',
      header: 'No',
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination

        return pageIndex * pageSize + row.index + 1
      },
    },
    {
      id: 'snapshotId',
      accessorKey: 'snapshotId',
      header: 'Snapshot ID',
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: (info) => formatDateTime(String(info.getValue())),
    },
    {
      id: 'level',
      accessorKey: 'level',
      header: 'Level',
      cell: (info) => {
        const value = info.getValue() as string
        return (
          <span
            className={cn(
              cn(
                value === LOGS_LEVEL.ERROR
                  ? 'text-destructive'
                  : value === LOGS_LEVEL.WARNING
                    ? 'text-yellow-500'
                    : 'text-[#00F0FF]',
              ),
            )}
          >
            {value ? value.toUpperCase() : ''}
          </span>
        )
      },
    },
    {
      id: 'message',
      accessorKey: 'message',
      header: 'Message',
    },
  ]
}
