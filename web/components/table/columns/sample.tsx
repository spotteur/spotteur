import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import TableAction from '@/components/action/TableAction'
import { Button } from '@/components/ui/button'
import { sample } from '@/db/schema/sample'
import { deleteData } from '@/lib/query/sample/query'

export const SampleColumns: ColumnDef<typeof sample.$inferSelect>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown />
        </Button>
      )
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: () => <span className="text-muted-foreground">Description</span>,
  },
  {
    id: 'action',
    accessorKey: 'action',
    header: () => <span className="text-muted-foreground float-right">Action</span>,
    cell: ({ row }) => {
      return <SampleColumnRendered id={row.original.id} title={row.original.name} />
    },
  },
]

export function SampleColumnRendered({ id, title }: { id: string; title: string }) {
  const handleChange = async (id: string) => {
    const res = await deleteData(id)
    if (res) {
      window.location.reload()
    }
  }
  return <TableAction id={id} title={title} onChange={handleChange} />
}
