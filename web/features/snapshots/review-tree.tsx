'use client'

import { FileCheck, FileDiff, FilePlus } from 'lucide-react'
import { useMemo } from 'react'

import { type TreeNode, TreeRoot } from '@/components/file-tree'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { type SnapshotDetailRes } from '@/features/snapshots/actions'

interface SnapshotReviewTreeProps {
  snapshotItems: SnapshotDetailRes[]
  selectedPath: string
  onSelectNode: (node: TreeNode) => void
  filterApplied: boolean
}

export const getSnapshotIcon = (snapshot: SnapshotDetailRes) => {
  if (!snapshot.baselineScreenshotMedia) {
    return <FilePlus size={16} className="text-success shrink-0" />
  }

  if (snapshot.diffPercentage && snapshot.diffPercentage > 0) {
    return <FileDiff size={16} className="text-destructive shrink-0" />
  }

  return <FileCheck size={16} className="text-success shrink-0" />
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
      id: `folder:${path}`,
      label,
      type: 'folder',
      path,
      children: [],
    }
    nodes.push(folder)
  }
  return { nodes: nodes, folder: folder }
}

const buildSnapshotTree = (snapshots: SnapshotDetailRes[]) => {
  const rootSet: Set<string> = new Set()
  const root: TreeNode[] = []

  snapshots.forEach((snapshot) => {
    const pathSegments = snapshot.pagePath.split('/').filter(Boolean)
    let currentNodes = root
    let currentPath = ''

    // Handle the root page path "/"
    if (pathSegments.length === 0) {
      const nodeId = snapshot.pagePath
      if (rootSet.has(nodeId)) {
        return
      }

      rootSet.add(nodeId)
      root.push({
        id: nodeId,
        label: '/',
        type: 'file',
        path: '/',
        icon: getSnapshotIcon(snapshot),
      })
      return
    }

    // Traverse segments to build nested folder structure
    pathSegments.forEach((segment, index) => {
      const isLastPathSegment = index === pathSegments.length - 1
      currentPath += (currentPath.endsWith('/') ? '' : '/') + segment

      // The current segment is the final part of the path (a "file")
      if (isLastPathSegment) {
        const nodeId = snapshot.pagePath
        if (rootSet.has(nodeId)) {
          return
        }

        rootSet.add(nodeId)
        currentNodes.push({
          id: nodeId,
          label: segment,
          type: 'file',
          path: snapshot.pagePath,
          icon: getSnapshotIcon(snapshot),
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

export function SnapshotReviewTree({
  snapshotItems,
  selectedPath,
  onSelectNode,
  filterApplied,
}: SnapshotReviewTreeProps) {
  const treeNodes = useMemo(() => buildSnapshotTree(snapshotItems), [snapshotItems])

  return (
    <TreeRoot
      nodes={treeNodes}
      expandAll={true}
      onSelectNode={onSelectNode}
      selectedNodeId={selectedPath}
      emptyState={
        <Empty className="h-full border-none p-6 md:p-6">
          <EmptyHeader>
            <EmptyTitle className="text-sm">
              {filterApplied ? 'No matching snapshots found' : 'No snapshots data'}
            </EmptyTitle>
            {filterApplied && (
              <EmptyDescription className="text-xs">Try adjusting your filters or search query</EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
