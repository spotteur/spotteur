import { eq } from 'drizzle-orm'
import { type Metadata } from 'next'
import { type ReactNode } from 'react'

import db from '@/db/drizzle'
import { projects } from '@/db/schema/project'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, (await params).id))
    .limit(1)
  if (project) {
    return {
      title: `Spotteur - ${project.name}`,
    }
  }

  return {
    title: 'Not Found',
  }
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children
}
