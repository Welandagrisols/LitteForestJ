/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Replit environment - allow specific dev origins
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? [
    '*.replit.dev',
    '*.replit.app', 
    'localhost',
    '127.0.0.1'
  ] : [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? ['https://www.littleforest.co.ke'] 
        : ['*.replit.dev', '*.replit.app', 'localhost', '127.0.0.1']
    }
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NODE_ENV === 'production' 
              ? 'https://www.littleforest.co.ke' 
              : '*' 
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
