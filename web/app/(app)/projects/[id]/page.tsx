'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { getProject, updateProject } from '@/features/projects/actions'
import { ProjectForm, type ProjectFormInput } from '@/features/projects/form'
import { ProjectFormSkeleton } from '@/features/projects/form-skeleton'

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const mutation = useMutation({
    mutationFn: async (values: ProjectFormInput) => updateProject(values),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success('Project updated', { description: 'Your changes were successfully saved.' })
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PROJECTS] })
      }
    },
  })

  if (isLoading || !data) {
    return (
      <div className="max-w-2xl p-4">
        <div className="mb-4">
          <Skeleton className="h-6 w-40 rounded" />
        </div>
        <ProjectFormSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Edit Project</h1>
      <ProjectForm
        key={data.id}
        defaultValues={{
          id: data.id,
          name: data.name,
          baseUrl: data.baseUrl,
          snapshotBrowser: data.snapshotBrowser as ProjectFormInput['snapshotBrowser'],
          snapshotSelector: data.snapshotSelector,
          snapshotWidth: data.snapshotWidth,
          snapshotHeight: data.snapshotHeight,
          pagePaths: Array.isArray(data.pagePaths) ? data.pagePaths : [],
          token: data.token ?? '',
        }}
        onSubmit={(values) => mutation.mutate(values as ProjectFormInput)}
        submitLabel="Update"
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
