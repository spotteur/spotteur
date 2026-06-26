'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InfoIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DEFAULT_ERROR_DESCRIPTION, DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { listBuildsByProjectQueryKey } from '@/constants/query-keys'

import { triggerBuildManual } from './actions'
import { TriggerBuildForm } from './form'
import { type TriggerBuildInput } from './schema'

export function TriggerBuildDialog({
  projectId,
  baseUrl,
  children,
}: {
  children: ReactNode
  projectId: string
  baseUrl: string
}) {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const triggerBuildMutation = useMutation({
    mutationFn: (values: { projectId: string; payload: TriggerBuildInput }) => triggerBuildManual(values),
    onSuccess: (res, variables) => {
      if (res.ok) {
        toast.success('Build triggered', { description: 'A new build was queued.' })
        queryClient.invalidateQueries({ queryKey: listBuildsByProjectQueryKey(variables.projectId) })
        setIsDialogOpen(false)
        return
      }

      toast.error('Failed to trigger build', { description: res.error })
    },
    onError: (error) => {
      console.error(error)
      toast.error(DEFAULT_ERROR_MESSAGE, { description: DEFAULT_ERROR_DESCRIPTION })
    },
  })

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trigger build</DialogTitle>
            <DialogDescription>
              Trigger a new build for this project. You can optionally provide a custom Base URL to test against.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30">
            <InfoIcon className="size-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">Custom Base URL Notice</AlertTitle>
            <AlertDescription className="text-blue-800/90 dark:text-blue-200/90">
              <div>
                Providing a different Base URL will trigger a <span className="font-bold">custom build</span>. A custom
                build with status &quot;Test Passed&quot; will <span className="font-bold">not update</span> your
                project&apos;s baseline build.
              </div>
            </AlertDescription>
          </Alert>
          <TriggerBuildForm
            defaultValues={{
              baseUrl,
            }}
            onSubmit={(payload) => triggerBuildMutation.mutate({ projectId, payload })}
            onCancel={() => setIsDialogOpen(false)}
            isSubmitting={triggerBuildMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
