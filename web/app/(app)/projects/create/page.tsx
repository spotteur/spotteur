'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { createProject } from '@/features/projects/actions'
import { ProjectForm, type ProjectFormInput } from '@/features/projects/form'

const DEFAULT_SNAPSHOT_BROWSER = 'chrome'
const DEFAULT_SNAPSHOT_SELECTOR = 'body'
const DEFAULT_SNAPSHOT_WIDTH = 1024
const DEFAULT_SNAPSHOT_HEIGHT = 768

export default function NewProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormInput) => createProject(values),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Project created', { description: 'Your project was successfully created.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PROJECTS] })
        router.push('/projects')
      }
    },
  })

  const defaultValues: ProjectFormInput = {
    name: '',
    baseUrl: '',
    snapshotBrowser: DEFAULT_SNAPSHOT_BROWSER,
    snapshotSelector: DEFAULT_SNAPSHOT_SELECTOR,
    snapshotWidth: DEFAULT_SNAPSHOT_WIDTH,
    snapshotHeight: DEFAULT_SNAPSHOT_HEIGHT,
    pagePaths: [],
    token: '',
  }

  return (
    <div className="max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Create Project</h1>
      <ProjectForm
        defaultValues={defaultValues}
        onSubmit={(values) => mutation.mutate(values)}
        submitLabel="Create"
        // isSuccess to keep it disabled after mutation success to prevent button re-enables during redirect
        isSubmitting={mutation.isPending || mutation.isSuccess}
      />
    </div>
  )
}
