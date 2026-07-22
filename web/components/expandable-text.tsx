'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRef, useState, useEffect, type CSSProperties } from 'react'

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
            !isExpanded && 'line-clamp-(--expandable-text-max-lines)',
          )}
          style={{ '--expandable-text-max-lines': maxLines } as CSSProperties}
        >
          {text}
        </div>
      </CollapsibleContent>
      {expandable && (
        <CollapsibleTrigger asChild>
          <Button variant="link" size="xs" className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}
