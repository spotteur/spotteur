'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { useHeaderBreadcrumbs, useHeaderNavigations } from '@/components/layout/header-context'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Card } from '@/components/ui/card'
import { projectsMenu } from '@/constants/app'
import { QUERY_KEY_PROJECTS } from '@/constants/query-keys'
import { getProject } from '@/features/projects/actions'
import { NavigationType } from '@/lib/type/app'

export default function ProjectPageRulesPage() {
  const params = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY_PROJECTS, params.id],
    queryFn: () => getProject(params.id),
  })

  const breadcrumbs = useMemo(
    () =>
      data ? (
        <>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/projects">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${params.id}`}>{data.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Page Rules</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : null,
    [data, params.id],
  )

  useHeaderBreadcrumbs(breadcrumbs, isLoading)

  const navigations = useMemo<NavigationType[]>(() => projectsMenu(params.id), [params.id])
  useHeaderNavigations(navigations)

  if (!isLoading && !data) {
    notFound()
  }

  return (
    <div className="space-y-4 p-4">
      <Card></Card>
    </div>
  )
}
