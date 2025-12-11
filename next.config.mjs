/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization for better performance
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'icons.duckduckgo.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
}

export default nextConfig
