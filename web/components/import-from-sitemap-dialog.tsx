'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { scanSitemapUrls } from '@/features/shared/actions/scan-sitemap-urls'

interface ImportFromSitemapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (paths: string) => void
}

export function ImportFromSitemapDialog({ open, onOpenChange, onImport }: ImportFromSitemapDialogProps) {
  const [sitemapUrl, setSitemapUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setSitemapUrl('')
        setError(null)
      }
    }
  }

  const handleImport = async () => {
    if (!sitemapUrl.trim()) {
      setError('Please enter a sitemap URL')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const urls = await scanSitemapUrls(sitemapUrl)
      if (urls.length === 0) {
        setError('No URLs found in the sitemap')
        setIsLoading(false)
        return
      }

      // Convert full URLs to paths
      const paths = urls
        .map((url) => {
          try {
            return new URL(url).pathname
          } catch {
            return null
          }
        })
        .filter((path) => path !== null && path !== '/') as string[]

      if (paths.length === 0) {
        setError('No valid paths found in the sitemap URLs')
        setIsLoading(false)
        return
      }

      onImport(paths.join('\n'))
      handleOpenChange(false)
      toast.success(`Imported ${paths.length} paths from sitemap`)
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sitemap'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Sitemap</DialogTitle>
          <DialogDescription>Enter a sitemap URL to import page paths</DialogDescription>
        </DialogHeader>

        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="sitemap-url">Sitemap URL</FieldLabel>
          <Input
            id="sitemap-url"
            placeholder="https://example.com/sitemap.xml"
            value={sitemapUrl}
            onBlur={() => setError(null)}
            onChange={(e) => {
              setSitemapUrl(e.target.value)
              setError(null)
            }}
            disabled={isLoading}
            aria-invalid={!!error}
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading && <Spinner />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
