/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
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
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig