'use client'

import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'

import { SampleColumns } from '@/components/table/columns/sample'
import TableComponent from '@/components/table/TableComponent'
import { sample } from '@/db/schema/sample'
import { selectAll } from '@/lib/query/sample/query'

export default function SamplePage() {
  const [data, setData] = useState<(typeof sample.$inferSelect)[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  useEffect(() => {
    const process = async () => {
      const result = await selectAll()

      if (result) {
        setData(result)
      }
    }

    process()
  }, [])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: SampleColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (!data) return <></>

  return <TableComponent table={table} columns={SampleColumns} />
}
