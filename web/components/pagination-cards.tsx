'use client'

import { Route } from 'next'
import { usePathname, useSearchParams } from 'next/navigation'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type PaginationCardProps = {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function PaginationCard({ page, total, pageSize, onPageChange }: PaginationCardProps) {
  const totalPages = Math.ceil(total / pageSize)

  const handlePageChange = (page: number) => {
    onPageChange(page)
  }

  if (totalPages <= 1) return null

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (page >= totalPages) {
                  handlePageChange(page - 1)
                }
              }}
            />
          </PaginationItem>
        )}

        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1
          return (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(p)
                }}
                isActive={p === page}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (page < totalPages) {
                  handlePageChange(page + 1)
                }
              }}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}
