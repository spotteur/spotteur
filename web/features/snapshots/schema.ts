import { z } from 'zod'

export const UpdateSnapshotNotesSchema = z.object({
  notes: z.string().nullable().optional(),
})

export type UpdateSnapshotNotesInput = z.infer<typeof UpdateSnapshotNotesSchema>
