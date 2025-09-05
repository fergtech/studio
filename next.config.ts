import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['bcrypt', 'bcryptjs', '@prisma/client'],
  trailingSlash: false,
  poweredByHeader: false,
  distDir: '.next',
  experimental: {
    // Remove problematic static generation settings that cause Jest worker issues
    // staticGenerationMaxConcurrency: 1,
    // staticGenerationMinPagesPerWorker: 25,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'societyplus.blob.core.windows.net',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'zk6uotmjy4iboi05.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
    ],
    // Optimize image loading
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week cache
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add timeout and retry configuration
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
