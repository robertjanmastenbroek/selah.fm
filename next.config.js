/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.midapi.ai' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  // Compress responses
  compress: true,
  // Reduce JS chunks for faster initial load
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks.minSize = 50000;
      config.optimization.splitChunks.maxSize = 200000;
    }
    return config;
  },
  // Allow larger body for image uploads (base64 data URLs)
  experimental: {
    serverComponentsExternalPackages: ['pg', 'puppeteer-core', 'puppeteer', '@sparticuz/chromium'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets aggressively (1 year — hashed filenames change on rebuild)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache public assets (images, fonts) for 1 week
        source: '/(images|fonts)/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        // Cache favicon and robots for 1 day
        source: '/(favicon\\.svg|robots\\.txt)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || 'https://selah.fm',
  },
  async redirects() {
    return [
      { source: '/artists', destination: '/artist', permanent: true },
      { source: '/artists/:path*', destination: '/artist/:path*', permanent: true },
    ];
  },
};

module.exports = nextConfig;
