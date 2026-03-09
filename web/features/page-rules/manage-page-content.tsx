import { MoreHorizontal, Trash } from 'lucide-react'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
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
  return (
    <Card className="rounded-none border-none bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Page configuration</CardTitle>
        <CardDescription className="text-muted-foreground flex space-x-2">
          <div>Page path: </div>
          {selectedPageRule ? (
            <Badge className="rounded-md">{selectedPageRule.pagePath}</Badge>
          ) : (
            <Skeleton className="h-5.5 w-48" />
          )}
        </CardDescription>
        <CardAction>
          {selectedPageRule ? (
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
          ) : (
            <Skeleton className="size-9" />
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedPageRule ? (
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
            }}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            errors={errors}
            projectId={selectedPageRule.projectId}
            onDirtyChange={onDirtyChange}
            onFormReady={onFormReady}
          />
        ) : (
          <Skeleton className="min-h-150 w-full" />
        )}
      </CardContent>
    </Card>
  )
}
