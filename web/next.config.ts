import { type NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'rustfs',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
