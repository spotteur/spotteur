import type { NextConfig } from 'next'
import type { RemotePattern } from 'next/dist/shared/lib/image-config'

import { S3_ENDPOINT } from '@/constants/env'

function getImageRemotePatterns(): (URL | RemotePattern)[] {
  if (!S3_ENDPOINT) {
    return []
  }

  const url = new URL(S3_ENDPOINT)
  const { hostname, port } = url
  const protocol = url.protocol.replace(':', '')
  if (protocol !== 'http' && protocol !== 'https') {
    return []
  }

  return [
    {
      protocol,
      hostname,
      port,
      pathname: '/**',
    } satisfies RemotePattern,
  ]
}

const nextConfig: NextConfig = {
  typedRoutes: true,
  crossOrigin: 'anonymous',
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: getImageRemotePatterns(),
  },
}

export default nextConfig
