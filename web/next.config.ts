import type { NextConfig } from 'next'
import type { RemotePattern } from 'next/dist/shared/lib/image-config'

function getImageRemotePatterns(): (URL | RemotePattern)[] {
  if (!process.env.S3_ENDPOINT) {
    return []
  }

  const url = new URL(process.env.S3_ENDPOINT)
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
  output: 'standalone',
  typedRoutes: true,
  crossOrigin: 'anonymous',
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: getImageRemotePatterns(),
  },
}

export default nextConfig
