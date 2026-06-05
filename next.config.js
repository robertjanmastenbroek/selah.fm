const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ['pg', 'puppeteer-core', 'puppeteer', '@sparticuz/chromium'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/artist/:slug/embed',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://api.deepseek.com https://selah.fm https://api.resend.com; frame-src https://js.stripe.com https://accounts.google.com; report-uri /api/csp-report" },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(images|fonts)/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
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

let config = withNextIntl(nextConfig);

if (process.env.SENTRY_AUTH_TOKEN) {
  try {
    const { withSentryConfig } = require('@sentry/nextjs');
    config = withSentryConfig(config, {
      silent: true,
      org: process.env.SENTRY_ORG || '',
      project: process.env.SENTRY_PROJECT || 'selahfm',
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    });
  } catch (e) {
    console.warn('[config] @sentry/nextjs not found — skipping source map upload');
  }
}

module.exports = config;
