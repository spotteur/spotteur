import type { NextConfig } from 'next'

import { type RemotePattern } from './types/app'

function getS3RemotePattern(): RemotePattern {
  const endpoint = process.env.S3_ENDPOINT

  if (!endpoint) {
    throw new Error('S3_ENDPOINT is not defined')
  }

  const url = new URL(endpoint)
  const protocol = url.protocol.replace(':', '')

  if (protocol !== 'http' && protocol !== 'https') {
    throw new Error(`Unsupported protocol: ${protocol}`)
  }

  return {
    protocol,
    hostname: url.hostname,
    port: url.port || undefined,
    pathname: '/**',
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [getS3RemotePattern()],
  },
}

export default nextConfig
