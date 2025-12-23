'use client'

import { EllipsisVertical } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface TableActionInterface {
  id: string
  title: string
  onChange: (id: string) => void
}

export default function TableAction({ id, title, onChange }: TableActionInterface) {
  const [open, setOpen] = useState(false)

  const handleChange = () => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div className="float-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuItem>
            <Link className="cursor-pointer" href={`/sample/${id}/update`}>
              Update
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              // e.preventDefault()
              setOpen(true)
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure to delete this <span className="font-bold">{title}</span>?
            </DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete your data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="cursor-pointer" variant="destructive" onClick={handleChange}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
