import { z } from 'zod'

export const payloadJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    projectName: { type: 'string', title: 'The project name', default: 'Demo Project' },
    buildIdentifier: { type: 'string', title: 'The build identifier', default: '3edfe26' },
    actionLink: { type: 'string', title: 'The action URL', default: 'https://example.com' },
  },
} as const

export const payloadSchema = z.object({
  projectName: z.string().default(payloadJsonSchema.properties.projectName.default),
  buildIdentifier: z.string().default(payloadJsonSchema.properties.buildIdentifier.default),
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
