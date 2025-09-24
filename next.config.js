
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['localhost', 'mjsuwlpixcregiikiusd.supabase.co'],
    unoptimized: false
  },
  // Remove Replit-specific origins for Vercel
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  // Vercel-optimized output
  output: 'standalone',
  swcMinify: true,
  // Disable source maps in production for smaller builds
  productionBrowserSourceMaps: false,
  // Optimize for Vercel
  compress: true
}

module.exports = nextConfig
