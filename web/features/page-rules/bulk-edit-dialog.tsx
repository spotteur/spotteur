'use client'

import Editor from '@monaco-editor/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function BulkEditDialog({
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

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="max-w-5xl!">
        <DialogHeader>
          <DialogTitle>Bulk edit page rules</DialogTitle>
        </DialogHeader>
        <div className="py-5">
          <Editor
            width="100%"
            height="600px"
            language="yaml"
            value={codeYaml}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
          />
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
