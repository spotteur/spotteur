'use client'

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'

interface ViewportDimensionInputProps {
  label: string
  value: number | string
  onChange: (value: number) => void
  onBlur: () => void
  isInvalid?: boolean
}

export function ViewportDimensionInput({
  label,
  value,
  onChange,
  onBlur,
  isInvalid = false,
}: ViewportDimensionInputProps) {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>{label}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        value={value || '0'}
        onBlur={onBlur}
        onChange={(e) => {
          const numValue = Number(e.target.value)
          if (!Number.isNaN(numValue)) {
            onChange(numValue)
          }
        }}
        aria-invalid={isInvalid}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>px</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
