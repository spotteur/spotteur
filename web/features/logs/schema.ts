import { z } from 'zod'

export const buildLogsSchema = z.object({
  buildId: z.string().optional(),
  snapshotId: z.string().optional(),
  message: z.string(),
  level: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date().optional(),
  id: z.string().optional(),
})

export type BuildLogsInput = z.input<typeof buildLogsSchema>
