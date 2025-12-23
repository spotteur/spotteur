import { ColumnDef } from '@tanstack/react-table'

import { users } from '@/db/schema'

export const UserColumns: ColumnDef<typeof users.$inferSelect>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => <span className="text-muted-foreground">Name</span>,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: () => <span className="text-muted-foreground">Email</span>,
  },
]
