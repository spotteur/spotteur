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

export type InputTagTypes = {
  value: string
  label: string
}

export interface InputTagInterface {
  defaultValue: string[]
  tags: InputTagTypes[]
  onRemove: (value: string[]) => void
  onSelect: (value: string[]) => void
}
const InputTags = ({ defaultValue, tags, onRemove, onSelect }: InputTagInterface) => {
  const [selected, setSelected] = useState<string[]>(defaultValue)
  const handleRemove = (value: string) => {
    setSelected((prev) => prev.filter((v) => v !== value))
    onRemove(selected.filter((v) => v !== value))
  }
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleRemove(value)
      return
    }
    setSelected((prev) => [...prev, value])
    onSelect([...selected, value])
  }
  return (
    <Tags>
      <TagsTrigger>
        {selected.map((tag) => (
          <TagsValue key={tag} onRemove={() => handleRemove(tag)}>
            {tags.find((t) => t.value === tag)?.label}
          </TagsValue>
        ))}
      </TagsTrigger>
      <TagsContent>
        <TagsInput placeholder="Search..." />
        <TagsList>
          <TagsEmpty />
          <TagsGroup>
            {tags.map((tag) => (
              <TagsItem key={tag.value} onSelect={handleSelect} value={tag.value}>
                {tag.label}
                {selected.includes(tag.value) && <CheckIcon className="text-muted-foreground" size={14} />}
              </TagsItem>
            ))}
          </TagsGroup>
        </TagsList>
      </TagsContent>
    </Tags>
  )
}
export default InputTags
