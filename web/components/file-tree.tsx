'use client'

import { ChevronRight, File } from 'lucide-react'
import { useState, type ReactNode, type MouseEvent } from 'react'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type TreeNode =
  | {
      type: 'folder'
      id: string
      label: string
      path: string
      children: TreeNode[]
    }
  | {
      type: 'file'
      id: string
      label: string
      path: string
      icon?: ReactNode
    }

interface TreeRootProps {
  nodes: TreeNode[]
  onSelectNode: (node: TreeNode) => void
  selectedNodeId?: string
  expandAll?: boolean
  emptyState?: ReactNode
}

interface TreeNodeProps {
  node: TreeNode
  level: number
  onSelectNode: (node: TreeNode) => void
  selectedNodeId?: string
  expandedNodes: Set<string>
  onToggleNode: (node: TreeNode) => void
}

function TreeNode({ node, level, onSelectNode, selectedNodeId, expandedNodes, onToggleNode }: TreeNodeProps) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedNodes.has(node.id)
  const isSelected = selectedNodeId === node.id

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      onToggleNode(node)
    } else {
      onSelectNode(node)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'group text-foreground flex cursor-pointer items-center gap-1 px-2 py-1.5 text-sm transition-colors',
          {
            'bg-accent': isSelected,
            'hover:bg-accent': !isSelected,
          },
        )}
        role="treeitem"
        aria-selected={isSelected}
        aria-current={isSelected ? true : undefined}
        aria-expanded={isFolder ? isExpanded : undefined}
        data-state={isFolder ? (isExpanded ? 'open' : 'closed') : undefined}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isFolder ? (
          <ChevronRight size={16} className="shrink-0 group-data-[state=open]:rotate-90" />
        ) : (
          <>
            <div className="w-px" />
            {node.icon ? node.icon : <File size={16} className="shrink-0" />}
          </>
        )}
        <span className="flex-1" title={isFolder ? undefined : `Open ${node.path}`}>
          {node.label}
        </span>
      </div>

      {isFolder && isExpanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
            />
          ))}
        </div>
      )}
    </>
  )
}

export function TreeRoot({ nodes, expandAll = false, onSelectNode, selectedNodeId, emptyState }: TreeRootProps) {
  const getInitialExpanded = (nodes: TreeNode[]): Set<string> => {
    const expanded = new Set<string>()

    const expandRecursive = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.type === 'folder') {
          expanded.add(node.id)
          expandRecursive(node.children)
        }
      })
    }

    const expandFirstNodeRecursive = (nodes: TreeNode[]) => {
      if (nodes.length === 0) return

      const node = nodes[0]
      if (node.type === 'folder') {
        expanded.add(node.id)
        if (node.children.length === 1 && node.children[0].type === 'folder') {
          expandFirstNodeRecursive(node.children)
        }
      }
    }

    if (expandAll) {
      expandRecursive(nodes)
    } else {
      expandFirstNodeRecursive(nodes)
    }

    return expanded
  }

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => getInitialExpanded(nodes))

  const handleToggleNode = (node: TreeNode) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(node.id)) {
        newSet.delete(node.id)
      } else {
        // Expand single-child folder
        const expandRecursive = (curr: TreeNode) => {
          if (curr.type === 'folder') {
            newSet.add(curr.id)
            if (curr.children?.length === 1 && curr.children[0].type === 'folder') {
              expandRecursive(curr.children[0])
            }
          }
        }
        expandRecursive(node)
      }

      return newSet
    })
  }

  return (
    <ScrollArea className="flex h-full flex-col whitespace-nowrap" type="always">
      <div role="tree" className="min-w-max flex-1">
        {nodes.length > 0 ? (
          nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onToggleNode={handleToggleNode}
            />
          ))
        ) : emptyState ? (
          emptyState
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">No data</p>
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
