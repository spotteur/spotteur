'use client'

import { useEffect, useState } from 'react'

import { MonacoEditorInput } from '@/components/monaco-editor-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function BulkEditPagesDialog({
  open,
  codeYaml,
  onImport,
  onCancel,
}: {
  open: boolean
  codeYaml: string
  onImport: (code: string) => void
  onCancel: () => void
}) {
  const [code, setCode] = useState(codeYaml)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCode(codeYaml)
  }, [codeYaml])

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-5xl!">
        <DialogHeader>
          <DialogTitle>Bulk Edit Pages</DialogTitle>
        </DialogHeader>
        <div className="py-5">
          <MonacoEditorInput height="70vh" language="yaml" value={code} onChange={(value) => setCode(value || '')} />
        </div>
        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" type="button" onClick={() => onImport(code)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
