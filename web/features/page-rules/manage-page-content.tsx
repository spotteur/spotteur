import { MoreHorizontal, Trash } from 'lucide-react'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { type PageRulesListItemRes } from '@/features/page-rules/actions'
import { PageRuleForm } from '@/features/page-rules/form'
import { type PageRuleFormInput } from '@/features/page-rules/schema'

type ManagePageContentProps = {
  selectedPageRule?: PageRulesListItemRes
  errors: $ZodFlattenedError<PageRuleFormInput> | undefined
  isSubmitting: boolean
  onSubmit: (values: PageRuleFormInput) => void
  onDirtyChange: (isDirty: boolean) => void
  onFormReady: (reset: (values: PageRuleFormInput) => void) => void
  onDeletePage: (page: { id: string; path: string }) => void
}

export function ManagePageContent({
  selectedPageRule,
  errors,
  isSubmitting,
  onSubmit,
  onDirtyChange,
  onFormReady,
  onDeletePage,
}: ManagePageContentProps) {
  if (!selectedPageRule) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No page selected</EmptyTitle>
          <EmptyDescription>
            Please select a page from the list on the left to view and edit its configuration.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card className="rounded-none border-none bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Page configuration</CardTitle>
        <CardDescription className="text-muted-foreground flex space-x-2">
          <div>Page path: </div>
          <Badge className="rounded-md">{selectedPageRule.pagePath}</Badge>
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  onDeletePage({
                    id: selectedPageRule.id,
                    path: selectedPageRule.pagePath,
                  })
                }}
              >
                <Trash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <PageRuleForm
          defaultValues={{
            pagePath: selectedPageRule.pagePath,
            snapshotBrowsers: selectedPageRule.snapshotBrowsers,
            viewports: selectedPageRule.viewports,
            mediaReset: selectedPageRule.mediaReset,
            reducedMotion: selectedPageRule.reducedMotion,
            rules: selectedPageRule.rules,
            hookAfterPageLoad: selectedPageRule.hookAfterPageLoad,
            hookBeforeScreenshot: selectedPageRule.hookBeforeScreenshot,
            proxy: selectedPageRule.proxy,
          }}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          projectId={selectedPageRule.projectId}
          onDirtyChange={onDirtyChange}
          onFormReady={onFormReady}
        />
      </CardContent>
    </Card>
  )
}
