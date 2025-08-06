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
    domains: ['logo.clearbit.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
}

export default nextConfig
