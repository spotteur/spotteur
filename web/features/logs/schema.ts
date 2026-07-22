import { z } from 'zod'

export const buildLogsSchema = z.object({
  buildId: z.string(),
  snapshotId: z.string().optional(),
  message: z.string(),
  level: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date().optional(),
  id: z.string().optional(),
})

export type BuildLogsInput = z.input<typeof buildLogsSchema>
