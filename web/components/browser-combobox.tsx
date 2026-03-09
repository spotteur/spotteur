'use client'

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox'
import { BROWSER_LABEL_MAP, BROWSER_OPTIONS, type Browser } from '@/constants/enum'

interface BrowserComboboxProps extends React.ComponentProps<typeof Combobox> {
  isInvalid?: boolean
}

export function BrowserCombobox({ value, onValueChange, isInvalid = false, ...props }: BrowserComboboxProps) {
  return (
    <Combobox multiple autoHighlight items={BROWSER_OPTIONS} value={value} onValueChange={onValueChange} {...props}>
      <ComboboxChips className="w-sm">
        <ComboboxValue>
          {(values: Browser[]) => (
            <>
              {values.map((browser) => (
                <ComboboxChip key={browser}>{BROWSER_LABEL_MAP[browser]}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-invalid={isInvalid} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent data-side="bottom">
        <ComboboxEmpty>No browser found.</ComboboxEmpty>
        <ComboboxList>
          {(item: (typeof BROWSER_OPTIONS)[number]) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
