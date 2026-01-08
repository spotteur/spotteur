import { Folder, Plus } from 'lucide-react'
import { Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function EmptySection({ url, label, title }: { url: string; label: string; title: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Folder />
        </EmptyMedia>
        <EmptyTitle>No {title} Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any {title} yet. Get started by creating your first {title}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button type="button" asChild>
            <Link href={url as Route}>
              <Plus />
              {label}
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}
