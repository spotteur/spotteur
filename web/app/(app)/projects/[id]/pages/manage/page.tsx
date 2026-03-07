'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { type $ZodFlattenedError } from 'zod/v4/core'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { projectsMenu } from '@/constants/app'
import { QUERY_KEY_PAGE_RULES, QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { listPageRulesByProjectV2, manageRule } from '@/features/page-rules/actions'
import { ConfirmChangePathDialog } from '@/features/page-rules/confim-change-path-dialog'
import { PageRuleV2Form } from '@/features/page-rules/form'
import { PageRulesTree } from '@/features/page-rules/page-tree'
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

  const { data: project, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const { data: pageRulesData } = useQuery({
    queryKey: [QUERY_KEY_PAGE_RULES, params.id],
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

  useEffect(() => {
    if (!selectedPath && pageRules.length > 0) {
      setSelectedPath(pageRules[0].pagePath)
    }
  }, [selectedPath, pageRules, setSelectedPath])

  const mutation = useMutation({
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
      console.error('Failed to update page:', error)
      toast.error('Failed to update page', {
        description: 'Something went wrong. Please try again later.',
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
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}/pages`}>Pages</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Manage</BreadcrumbPage>
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

  useEffect(() => {
    if (selectedPageRule && resetFormRef.current) {
      resetFormRef.current(selectedPageRule)
    }
  }, [selectedPageRule])

  if (!isLoading && !project) {
    notFound()
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-row items-center gap-3 rounded-lg shadow-none">
        <InputGroup className="w-sm">
          <InputGroupInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      <ResizablePanelGroup orientation="horizontal" className="min-h-screen w-full rounded-lg border">
        <ResizablePanel collapsible minSize="12%" defaultSize="20%" maxSize="35%">
          <PageRulesTree
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
        <ResizablePanel className="p-4">
          {project && selectedPageRule && (
            <>
              <h2 className="mb-4 text-xl font-bold">{selectedPageRule.pagePath}</h2>
              <PageRuleV2Form
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
                onSubmit={(values) => mutation.mutate(values)}
                isSubmitting={mutation.isPending}
                errors={formErrors}
                project={project}
                onDirtyChange={setIsFormDirty}
                onFormReady={handleFormReady}
              />
            </>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
      <ConfirmChangePathDialog
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
    </div>
  )
}
