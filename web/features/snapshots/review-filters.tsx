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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BROWSER_OPTIONS } from '@/constants/enum'
import { SNAPSHOT_APPROVAL_STATUS_OPTIONS } from '@/constants/status-map'

interface SnapshotReviewFiltersProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  browsers: string[]
  setBrowsers: (updater: (prev: string[]) => string[]) => void
  status: string
  setStatus: (value: string) => void
  hideExactlyMatch: boolean
  setHideExactlyMatch: (value: boolean) => void
  hideNewPage: boolean
  setHideNewPage: (value: boolean) => void
  diffTolerancePercentage: number
}

export function SnapshotReviewFilters({
  searchQuery,
  setSearchQuery,
  browsers,
  setBrowsers,
  status,
  setStatus,
  hideExactlyMatch,
  setHideExactlyMatch,
  hideNewPage,
  setHideNewPage,
  diffTolerancePercentage,
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-58 justify-start">
            {status ? `Filtered by status: ${status}` : 'Filter by status...'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {SNAPSHOT_APPROVAL_STATUS_OPTIONS.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={status === value}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatus(value)
                  } else {
                    setStatus('')
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
        <FieldLabel htmlFor="hideExactlyMatch">
          <Tooltip>
            <TooltipTrigger>
              <span>Hide exactly matching snapshots</span>
            </TooltipTrigger>
            <TooltipContent>{`Diff tolerance percentage set to ${diffTolerancePercentage}%`}</TooltipContent>
          </Tooltip>
        </FieldLabel>
      </Field>
      <Field orientation="horizontal" className="w-xs">
        <Checkbox id="hideNewPage" checked={hideNewPage} onCheckedChange={(checked) => setHideNewPage(!!checked)} />
        <FieldLabel htmlFor="hideNewPage">Hide snapshot of newly added page</FieldLabel>
      </Field>
    </div>
  )
}
