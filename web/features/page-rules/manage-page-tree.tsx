'use client'

import { useMemo } from 'react'

import { type TreeNode, TreeRoot } from '@/components/file-tree'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { type PageRulesListItemRes } from '@/features/page-rules/actions'

interface PageTreeProps {
  pageRules: PageRulesListItemRes[]
  selectedPath: string
  onSelectNode: (node: TreeNode) => void
  filterApplied: boolean
}

const findOrCreateFolder = (
  nodes: TreeNode[],
  label: string,
  path: string,
): { nodes: TreeNode[]; folder: TreeNode & { type: 'folder' } } => {
  let folder = nodes.find((n) => n.type === 'folder' && n.label === label) as
    | (TreeNode & { type: 'folder' })
    | undefined
  if (!folder) {
    folder = {
      id: path,
      label,
      type: 'folder',
      path,
      children: [],
    }
    nodes.push(folder)
  }
  return { nodes: nodes, folder: folder }
}

const buildPageTree = (pageRules: PageRulesListItemRes[]) => {
  const rootSet: Set<string> = new Set()
  const root: TreeNode[] = []

  pageRules.forEach((pageRule) => {
    const pathSegments = pageRule.pagePath.split('/').filter(Boolean)
    let currentNodes = root
    let currentPath = ''

    // Handle the root page path "/"
    if (pathSegments.length === 0) {
      const nodeId = pageRule.pagePath
      if (rootSet.has(nodeId)) {
        return
      }

      rootSet.add(nodeId)
      root.push({
        id: nodeId,
        label: '/',
        type: 'file',
        path: '/',
      })
      return
    }

    // Traverse segments to build nested folder structure
    pathSegments.forEach((segment, index) => {
      const isLastPathSegment = index === pathSegments.length - 1
      currentPath += (currentPath.endsWith('/') ? '' : '/') + segment

      // The current segment is the final part of the path (a "file")
      if (isLastPathSegment) {
        const nodeId = pageRule.pagePath
        if (rootSet.has(nodeId)) {
          return
        }

        rootSet.add(nodeId)
        currentNodes.push({
          id: nodeId,
          label: segment,
          type: 'file',
          path: pageRule.pagePath,
        })
      } else {
        // The current segment is an intermediate part of the path (a "folder")
        const { folder } = findOrCreateFolder(currentNodes, segment, currentPath)
        currentNodes = folder.children
      }
    })
  })

  return root
}

export function ManagePagesTree({ pageRules, selectedPath, onSelectNode, filterApplied }: PageTreeProps) {
  const treeNodes = useMemo(() => buildPageTree(pageRules), [pageRules])

  return (
    <TreeRoot
      nodes={treeNodes}
      expandAll={true}
      onSelectNode={onSelectNode}
      selectedNodeId={selectedPath}
      emptyState={
        <Empty className="h-full border-none p-6 md:p-6">
          <EmptyHeader>
            <EmptyTitle className="text-sm">{filterApplied ? 'No matching page found' : 'No pages data'}</EmptyTitle>
            {filterApplied && (
              <EmptyDescription className="text-xs">Try adjusting your filters or search query</EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
