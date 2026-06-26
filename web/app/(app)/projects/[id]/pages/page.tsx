'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { ConfirmUnsavedChangesDialog } from '@/components/confim-unsaved-changes-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_MESSAGE,
  projectsMenu,
  VALIDATION_ERROR_DESCRIPTION,
} from '@/constants/app'
import { detailProjectQueryKey, listPageRulesByProjectQueryKey } from '@/constants/query-keys'
import {
  createPageRule,
  deletePageRule,
  existingPageRules,
  listPageRulesByProject,
  manageRule,
  upsertPageRules,
} from '@/features/page-rules/actions'
import { BulkEditPagesDialog } from '@/features/page-rules/bulk-edit-pages-dialog'
import { CreatePagesDialog } from '@/features/page-rules/create-pages-dialog'
import { ManagePageContent } from '@/features/page-rules/manage-page-content'
import { ManagePagesTree } from '@/features/page-rules/manage-page-tree'
import { type PageRuleCreateFormInput, type PageRuleFormInput } from '@/features/page-rules/schema'
import { getProject } from '@/features/projects/actions'
import { type NavigationType } from '@/types/app'

export default function ManagePages() {
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<$ZodFlattenedError<PageRuleFormInput> | undefined>(undefined)
  const [createFormErrors, setCreateFormErrors] = useState<$ZodFlattenedError<PageRuleCreateFormInput> | undefined>(
    undefined,
  )
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [pendingSelectedPath, setPendingSelectedPath] = useState<string>('')
  const [openUnsavedChangesDialog, setOpenUnsavedChangesDialog] = useState(false)
  const resetFormRef = useRef<((values: PageRuleFormInput) => void) | null>(null)
  const params = useParams<{ id: string }>()

  const [selectedPath, setSelectedPath] = useQueryState('path', parseAsString.withDefault(''))
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))

  const { data: project, isLoading } = useQuery({
    queryKey: detailProjectQueryKey(params.id),
    queryFn: () => getProject(params.id),
  })

  const { data: pageRulesData, isLoading: isPageRulesLoading } = useQuery({
    queryKey: listPageRulesByProjectQueryKey(params.id, 'tree'),
    queryFn: () => listPageRulesByProject({ projectId: params.id }),
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
    mutationFn: async (payload: PageRuleFormInput) => manageRule({ projectId: params.id, payload }),
    onSuccess: (res) => {
      if (res.ok) {
        setIsFormDirty(false)
        toast.success('Page updated', { description: 'Your page was successfully updated.' })
        queryClient.invalidateQueries({ queryKey: listPageRulesByProjectQueryKey(params.id) })
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

  const createPagesMutation = useMutation({
    mutationFn: async (payload: unknown) => createPageRule({ projectId: project ? project.id : '', payload }),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: listPageRulesByProjectQueryKey(params.id) })
        toast.success('Pages created', {
          description: 'Page successfully created.',
        })
        setOpenAddPagesDialog(false)
        return
      } else {
        setCreateFormErrors(res.errors)
        toast.error('Failed to create page', { description: VALIDATION_ERROR_DESCRIPTION })
      }
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, {
        description: DEFAULT_ERROR_DESCRIPTION,
      })
    },
  })

  const [pendingDeletePage, setPendingDeletePage] = useState<{ id: string; path: string } | null>(null)
  const deletePageMutation = useMutation({
    mutationFn: (id: string) => deletePageRule({ projectId: params.id, id }),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: listPageRulesByProjectQueryKey(params.id) })
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

  const [openBulkEditDialog, setOpenBulkEditDialog] = useState<boolean>(false)
  const [openAddPagesDialog, setOpenAddPagesDialog] = useState<boolean>(false)
  const { data: existingPagesData } = useQuery({
    queryKey: listPageRulesByProjectQueryKey(params.id, 'yaml'),
    queryFn: () => existingPageRules(params.id),
    enabled: !!params.id,
  })
  const importMutation = useMutation({
    mutationFn: (schema: string) => upsertPageRules(schema, params.id),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: listPageRulesByProjectQueryKey(params.id) })
        toast.success('Pages updated', { description: 'Pages were successfully updated.' })
        setOpenBulkEditDialog(false)
        return
      }

      if (res.errors) {
        const fieldErrors = Object.values(res.errors.fieldErrors)
        if (fieldErrors.length > 0) {
          toast.error('Failed to update pages', {
            description: (
              <ul>
                {fieldErrors.map((row, index) => {
                  return (
                    <li key={index}>
                      {(row || []).map((message, i) => (
                        <p key={i}>
                          {index + 1} - {message}
                        </p>
                      ))}
                    </li>
                  )
                })}
              </ul>
            ),
          })
          return
        }

        const formErrors = Object.values(res.errors.formErrors)
        if (formErrors.length > 0) {
          toast.error('Failed to update pages', {
            description: formErrors.map((message, index) => <p key={index}>{message}</p>),
          })
          return
        }
      }

      throw new Error(res.error)
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
          <Button
            onClick={() => {
              setCreateFormErrors(undefined)
              setOpenAddPagesDialog(true)
            }}
          >
            <Plus />
            Add new page
          </Button>
          <Button onClick={() => setOpenBulkEditDialog(true)}>
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
                setPendingSelectedPath(node.path)
                setOpenUnsavedChangesDialog(true)
                return
              }

              setSelectedPath(node.path)
            }}
            filterApplied={searchQuery.length > 0}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <ManagePageContent
            selectedPageRule={selectedPageRule}
            errors={formErrors}
            isSubmitting={updatePageMutation.isPending}
            onSubmit={(values) => updatePageMutation.mutate(values)}
            onDirtyChange={setIsFormDirty}
            onFormReady={handleFormReady}
            onDeletePage={(page) => setPendingDeletePage(page)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <ConfirmUnsavedChangesDialog
        open={openUnsavedChangesDialog}
        onConfirm={() => {
          setSelectedPath(pendingSelectedPath)
          setPendingSelectedPath('')
          setOpenUnsavedChangesDialog(false)
        }}
        onCancel={() => {
          setPendingSelectedPath('')
          setOpenUnsavedChangesDialog(false)
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
      <BulkEditPagesDialog
        open={openBulkEditDialog}
        codeYaml={existingPagesData || ''}
        onImport={importMutation.mutate}
        onCancel={() => setOpenBulkEditDialog(false)}
      />
      <CreatePagesDialog
        open={openAddPagesDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCreateFormErrors(undefined)
          }
          setOpenAddPagesDialog(open)
        }}
        onSubmit={createPagesMutation.mutate}
        isSubmitting={createPagesMutation.isPending}
        errors={createFormErrors}
      />
    </div>
  )
}
