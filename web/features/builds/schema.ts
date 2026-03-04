import { z } from 'zod'

import { BaseUrlSchema } from '@/features/projects/schema'

export const BuildIdentifierSchema = z.string().transform((value) => {
  const trimmed = value?.trim()
  return trimmed === '' ? undefined : trimmed
})

const BuildNotesSchema = z.string().nullable().optional()

export const TriggerBuildSchema = z.object({
  identifier: BuildIdentifierSchema.optional(),
  baseUrl: BaseUrlSchema.optional(),
  notes: BuildNotesSchema,
})

export type TriggerBuildInput = z.infer<typeof TriggerBuildSchema>

export const TriggerBuildApiSchema = z.object({
  ...TriggerBuildSchema.shape,
  projectId: z.string(),
  projectToken: z.string(),
})

export type TriggerBuildApiInput = z.infer<typeof TriggerBuildApiSchema>

export const UpdateBuildNotesSchema = z.object({
  notes: BuildNotesSchema,
})

export type UpdateBuildNotesInput = z.infer<typeof UpdateBuildNotesSchema>
