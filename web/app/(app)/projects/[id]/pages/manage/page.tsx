'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, MoreHorizontal, Plus, Search, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { ConfirmUnsavedChangesDialog } from '@/components/confim-unsaved-changes-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE, projectsMenu } from '@/constants/app'
import { QUERY_KEY_PAGE_RULES, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { deletePageRule, listPageRulesByProjectV2, manageRule } from '@/features/page-rules/actions'
import { PageRuleForm } from '@/features/page-rules/form'
import { ManagePagesTree } from '@/features/page-rules/manage-page-tree'
import { type PageRuleFormInput } from '@/features/page-rules/schema'
import { getProject } from '@/features/projects/actions'
import { type NavigationType } from '@/types/app'

export default function ManagePages() {
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<PageRuleFormInput> | undefined>(undefined)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [openChangePathDialog, setOpenChangePathDialog] = useState(false)
  const [pendingPath, setPendingPath] = useState<string>('')
  const resetFormRef = useRef<((values: PageRuleFormInput) => void) | null>(null)
  const params = useParams<{ id: string }>()

  const [selectedPath, setSelectedPath] = useQueryState('path', parseAsString.withDefault(''))
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))

  const [pendingDeletePage, setPendingDeletePage] = useState<{ id: string; path: string } | null>(null)
  const deletePageMutation = useMutation({
    mutationFn: (id: string) => deletePageRule(id),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES] })
        toast.success('Page deleted', { description: 'The page was successfully deleted.' })
        setPendingDeletePage(null)
        setSelectedPath('')

        return
      }

      throw new Error('Failed to delete page')
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, {
        description: DEFAULT_ERROR_DESCRIPTION,
      })
    },
  })

  const { data: project, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const { data: pageRulesData, isLoading: isPageRulesLoading } = useQuery({
    queryKey: [QUERY_KEY_PAGE_RULES, params.id, 'tree'],
    queryFn: () => listPageRulesByProjectV2({ projectId: params.id }),
  })

  const pageRules = useMemo(() => {
    return (pageRulesData?.data ?? []).filter((pageRule) => {
      const matchesSearch = pageRule.pagePath.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [pageRulesData, searchQuery])

  const selectedPageRule = useMemo(() => {
    if (pageRules.length === 0) {
      return undefined
    }

    if (selectedPath) {
      return pageRules.find((pageRule) => pageRule.pagePath === selectedPath)
    }

    return pageRules[0]
  }, [selectedPath, pageRules])

  // Pre-select the first page if no page is selected yet
  useEffect(() => {
    if (!selectedPath && pageRules.length > 0) {
      setSelectedPath(pageRules[0].pagePath)
    }
  }, [selectedPath, pageRules, setSelectedPath])

  const updatePageMutation = useMutation({
    mutationFn: async (values: PageRuleFormInput) => manageRule(values, project ? project.id : ''),
    onSuccess: (res) => {
      if (res.ok) {
        setIsFormDirty(false)
        toast.success('Page updated', { description: 'Your page was successfully updated.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAGE_RULES] })
      } else {
        setFormErrors(res.error)
        toast.error('Failed to update page', { description: 'Please review the error and try again.' })
      }
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, {
        description: DEFAULT_ERROR_DESCRIPTION,
      })
    },
  })

  const breadcrumbs = useMemo(
    () =>
      project ? (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/projects">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}`}>{project.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pages</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [project, params.id],
  )
  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  const navigations = useMemo<NavigationType[]>(() => projectsMenu(params.id), [params.id])
  useHeaderNavigations(navigations)

  const handleFormReady = useCallback((reset: (values: PageRuleFormInput) => void) => {
    resetFormRef.current = reset
  }, [])

  // Reset the form with new values when a different page is selected
  useEffect(() => {
    if (selectedPageRule && resetFormRef.current) {
      resetFormRef.current(selectedPageRule)
    }
  }, [selectedPageRule])

  if (!isLoading && !project) {
    notFound()
  }

  if (isLoading || isPageRulesLoading) {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="flex h-9 flex-row items-center gap-3 p-2 shadow-none" />
        <Skeleton className="min-h-screen w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-between">
        <div className="flex flex-row items-center gap-3 rounded-lg shadow-none">
          <InputGroup className="w-sm">
            <InputGroupInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedPath('')
              }}
              placeholder="Filter by page paths..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            {searchQuery && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={() => setSearchQuery('')}>
                  <span className="sr-only">Clear search</span>
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <div className="space-x-3">
          <Button>
            <Plus />
            Add new page
          </Button>
          <Button>
            <Edit />
            Bulk edit pages
          </Button>
        </div>
      </div>
      <ResizablePanelGroup orientation="horizontal" className="min-h-screen w-full rounded-lg border">
        <ResizablePanel collapsible minSize="12%" defaultSize="20%" maxSize="35%">
          <ManagePagesTree
            pageRules={pageRules}
            selectedPath={selectedPath}
            onSelectNode={(node) => {
              if (isFormDirty && node.path !== selectedPath) {
                setPendingPath(node.path)
                setOpenChangePathDialog(true)
                return
              }

              setSelectedPath(node.path)
            }}
            filterApplied={searchQuery.length > 0}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
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
                          setPendingDeletePage({
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
              {project && selectedPageRule ? (
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
                  onSubmit={(values) => updatePageMutation.mutate(values)}
                  isSubmitting={updatePageMutation.isPending}
                  errors={formErrors}
                  project={project}
                  onDirtyChange={setIsFormDirty}
                  onFormReady={handleFormReady}
                />
              ) : (
                <Skeleton className="min-h-150 w-full" />
              )}
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
      <ConfirmUnsavedChangesDialog
        open={openChangePathDialog}
        onConfirm={() => {
          if (pendingPath) {
            setSelectedPath(pendingPath)
          }

          setPendingPath('')
          setOpenChangePathDialog(false)
        }}
        onCancel={() => {
          setPendingPath('')
          setOpenChangePathDialog(false)
        }}
      />
      <ConfirmDeleteDialog
        open={!!pendingDeletePage}
        valueToMatch={pendingDeletePage?.path ?? ''}
        title="Delete Page"
        instruction="Type the page path to confirm"
        confirmButtonText="Delete Page"
        onCancel={() => setPendingDeletePage(null)}
        onConfirm={() => {
          if (pendingDeletePage) {
            deletePageMutation.mutate(pendingDeletePage.id)
          }
        }}
      />
    </div>
  )
}
