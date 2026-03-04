import { z } from 'zod'

import { BaseUrlSchema } from '@/features/projects/schema'

export const BuildIdentifierSchema = z.string().transform((value) => {
  const trimmed = value?.trim()
  return trimmed === '' ? undefined : trimmed
})

export const TriggerBuildSchema = z.object({
  projectId: z.string(),
  identifier: BuildIdentifierSchema.optional(),
  baseUrl: BaseUrlSchema.optional(),
})

export const TriggerBuildApiSchema = z.object({
  projectId: z.string(),
  identifier: BuildIdentifierSchema.optional(),
  baseUrl: BaseUrlSchema.optional(),
  projectToken: z.string(),
})

export type TriggerBuildInput = z.infer<typeof TriggerBuildSchema>

export const UpdateBuildNotesSchema = z.object({
  notes: z.string().nullable().optional(),
})

export type UpdateBuildNotesInput = z.infer<typeof UpdateBuildNotesSchema>
