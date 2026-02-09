'use client'
import { CheckIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from '@/components/ui/tags'
import { cn } from '@/lib/utils'

export type InputTagTypes = {
  value: string
  label: string
}

export interface InputTagInterface {
  defaultValue: string
  tags: InputTagTypes[]
  onSelect: (value: string) => void
  isInvalid: boolean
}
const InputTag = ({ defaultValue, tags, onSelect, isInvalid }: InputTagInterface) => {
  const [open, setOpen] = useState(false)
  return (
    <Tags open={open} onOpenChange={setOpen}>
      <TagsTrigger className={cn(isInvalid ? 'border-destructive!' : '')}>
        {defaultValue && <TagsValue>{defaultValue}</TagsValue>}
      </TagsTrigger>
      <TagsContent>
        <TagsInput placeholder="Search..." />
        <TagsList>
          <TagsEmpty />
          <TagsGroup>
            {tags.map((tag) => (
              <TagsItem
                key={tag.value}
                onSelect={() => {
                  onSelect(tag.value)
                  setOpen(false)
                }}
                value={tag.value}
              >
                {tag.label}
                {defaultValue === tag.value && <CheckIcon className="text-muted-foreground" size={14} />}
              </TagsItem>
            ))}
          </TagsGroup>
        </TagsList>
      </TagsContent>
    </Tags>
  )
}
export default InputTag
