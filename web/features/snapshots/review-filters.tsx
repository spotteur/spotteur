'use client'

import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { BROWSER_OPTIONS } from '@/constants/enum'

interface SnapshotReviewFiltersProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  browsers: string[]
  setBrowsers: (updater: (prev: string[]) => string[]) => void
  hideExactlyMatch: boolean
  setHideExactlyMatch: (value: boolean) => void
  hideNewPage: boolean
  setHideNewPage: (value: boolean) => void
}

export function SnapshotReviewFilters({
  searchQuery,
  setSearchQuery,
  browsers,
  setBrowsers,
  hideExactlyMatch,
  setHideExactlyMatch,
  hideNewPage,
  setHideNewPage,
}: SnapshotReviewFiltersProps) {
  return (
    <div className="flex flex-row items-center gap-3 rounded-lg shadow-none">
      <InputGroup className="w-sm">
        <InputGroupInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by page paths..."
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        {searchQuery && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => setSearchQuery('')}>
              <span className="sr-only">Clear search</span>
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-48 justify-start">
            {browsers.length > 0 ? `Filtered by ${browsers.length} browser(s)` : 'Filter by browser...'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {BROWSER_OPTIONS.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={browsers.includes(value)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setBrowsers((prev) => [...prev, value])
                  } else {
                    setBrowsers((prev) => prev.filter((b) => b !== value.toString()))
                  }
                }}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Field orientation="horizontal" className="w-xs">
        <Checkbox
          id="hideExactlyMatch"
          checked={hideExactlyMatch}
          onCheckedChange={(checked) => setHideExactlyMatch(!!checked)}
        />
        <FieldLabel htmlFor="hideExactlyMatch">Hide exactly matching snapshots</FieldLabel>
      </Field>
      <Field orientation="horizontal" className="w-xs">
        <Checkbox id="hideNewPage" checked={hideNewPage} onCheckedChange={(checked) => setHideNewPage(!!checked)} />
        <FieldLabel htmlFor="hideNewPage">Hide snapshot of newly added page</FieldLabel>
      </Field>
    </div>
  )
}
