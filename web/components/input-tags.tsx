'use client'
import { CheckIcon } from 'lucide-react'

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

export type InputTagsTypes = {
  value: string
  label: string
}

export interface InputTagsInterface {
  defaultValue: string[]
  tags: InputTagsTypes[]
  onRemove: (value: string[]) => void
  onSelect: (value: string[]) => void
}
const InputTags = ({ defaultValue, tags, onRemove, onSelect }: InputTagsInterface) => {
  const handleRemove = (value: string) => {
    onRemove(defaultValue.filter((v) => v !== value))
    onSelect(defaultValue.filter((v) => v !== value))
  }
  const handleSelect = (value: string) => {
    if (defaultValue.includes(value)) {
      handleRemove(value)
      return
    }
    onSelect([...defaultValue, value])
  }
  return (
    <Tags>
      <TagsTrigger>
        {defaultValue.map((tag) => (
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
                {defaultValue.includes(tag.value) && <CheckIcon className="text-muted-foreground" size={14} />}
              </TagsItem>
            ))}
          </TagsGroup>
        </TagsList>
      </TagsContent>
    </Tags>
  )
}
export default InputTags
