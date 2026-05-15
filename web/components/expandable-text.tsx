'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface ExpandableTextProps {
  text: string
  maxLines?: number
  className?: string
}

export function ExpandableText({ text, maxLines = 2, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandable, setExpandable] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = textRef.current
    if (element) {
      const lineHeight = parseInt(getComputedStyle(element).lineHeight)
      const height = element.scrollHeight

      setExpandable(!!(height > lineHeight * maxLines + 2))
    }
  }, [text, maxLines])

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={cn('relative', className)}>
      <CollapsibleContent forceMount>
        <div
          ref={textRef}
          className={cn(
            'text-foreground whitespace-pre-wrap transition-all duration-200',
            !isExpanded && 'line-clamp-2',
          )}
          style={
            !isExpanded
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {text}
        </div>
      </CollapsibleContent>
      {expandable && (
        <CollapsibleTrigger asChild>
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-foreground relative mt-1 h-auto p-0 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp />
                Show less
              </>
            ) : (
              <>
                <ChevronDown />
                Show more
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}
