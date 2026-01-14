import { z } from 'zod'

export const payloadJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    buildIdentifier: { type: 'string', title: 'The build identifier', default: '3edfe26' },
    hasDiffSnapshotCount: { type: 'number', title: 'The total snapshot that has diff', default: 3 },
    totalSnapshotCount: { type: 'number', title: 'The total snapshot count', default: 10 },
    actionLink: { type: 'string', title: 'The action URL', default: 'https://example.com' },
  },
} as const

export const payloadSchema = z.object({
  buildIdentifier: z.string().default(payloadJsonSchema.properties.buildIdentifier.default),
  hasDiffSnapshotCount: z.number().default(payloadJsonSchema.properties.hasDiffSnapshotCount.default),
  totalSnapshotCount: z.number().default(payloadJsonSchema.properties.totalSnapshotCount.default),
  actionLink: z.string().default(payloadJsonSchema.properties.actionLink.default),
})

export const controlJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {},
} as const

export const controlSchema = z.object({})

export type PayloadSchema = z.infer<typeof payloadSchema>

export type ControlSchema = z.infer<typeof controlSchema>
