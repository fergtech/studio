import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['bcrypt', 'bcryptjs', '@prisma/client'],
  // Disable static optimization for API routes to prevent build-time analysis
  trailingSlash: false,
  poweredByHeader: false,
  // Skip static generation for problematic routes
  generateBuildId: async () => {
    return 'railway-build'
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
    ],
  },
};

export default nextConfig;
