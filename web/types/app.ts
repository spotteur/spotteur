import { type Route } from 'next'

export type NavigationType = {
  label: string
  url: Route
}

export type RemotePattern = {
  protocol?: 'http' | 'https'
  hostname: string
  port?: string
  pathname?: string
}
