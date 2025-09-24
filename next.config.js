/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['localhost', 'mjsuwlpixcregiikiusd.supabase.co'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  // Allow cross-origin requests from Replit domains and localhost
  allowedDevOrigins: [
    '*.replit.dev', 
    '*.replit.co', 
    '*.janeway.replit.dev',
    '*.riker.replit.dev',
    '127.0.0.1', 
    'localhost'
  ],
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
  output: 'standalone',
  swcMinify: true
}

module.exports = nextConfig