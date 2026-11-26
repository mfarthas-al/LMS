/** @type {import('next').NextConfig} */

// Security headers applied to every page.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com",
      // YouTube privacy-enhanced embeds + PayHere checkout
      'frame-src https://www.youtube-nocookie.com https://www.youtube.com https://sandbox.payhere.lk https://www.payhere.lk',
      "img-src 'self' data: https://i.ytimg.com",
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ''}`,
      "form-action 'self' https://sandbox.payhere.lk https://www.payhere.lk",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  // Standalone output = small, host-agnostic Docker image. It needs symlinks, which Windows
  // blocks without Developer Mode, so it's only enabled on Linux/macOS (Docker, CI).
  output: process.platform === 'win32' ? undefined : 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@lms/shared', '@lms/api-client'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
