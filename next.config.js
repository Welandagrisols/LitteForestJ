
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ['*'],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mjsuwlpixcregiikiusd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      }
    ],
    unoptimized: false
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=3600, must-revalidate'
          }
        ]
      }
    ]
  },
  swcMinify: true,
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true
}

module.exports = nextConfig
