import type { NextConfig } from 'next'

const config: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  devIndicators: false, // keep the dev badge out of framed demos
  // proxy.ts buffers request bodies; the 10 MB default truncates multi-photo uploads. Matches MAX_BYTES in api/tours.
  experimental: { proxyClientMaxBodySize: '50mb' },
  async headers() {
    return [
      // Any site may frame the viewer; that's the product.
      { source: '/t/:path*', headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }] },
      // Everything else (admin, analytics, Expire button) only frames itself, so other sites can't clickjack it.
      { source: '/:path((?!t/).*)', headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }] },
      // Uploaded files are served with their declared type only.
      { source: '/uploads/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }] },
    ]
  },
}
export default config
