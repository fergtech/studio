import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  httpAgentOptions: {
    keepAlive: true,
  },
  serverExternalPackages: [
    'bcrypt',
    'bcryptjs',
    '@prisma/client',
  ],
  trailingSlash: false,
  poweredByHeader: false,
  distDir: '.next',
  turbopack: {
    rules: {},
  },
  experimental: {
    // Settings to prevent chunk loading issues
    optimizeCss: false,
  },
  webpack: (config, { dev, isServer, webpack }) => {
    // Fix OpenTelemetry and uuid module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@opentelemetry/api': require.resolve('@opentelemetry/api'),
      'uuid': require.resolve('uuid'),
    };

    // Enable ESM resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };

    // Fix chunk loading timeout issues in Next.js 15
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        buffer: false,
        process: false,
        stream: false,
        util: false,
      };

      // Prevent chunk loading timeout errors
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              enforce: true,
            },
          },
        },
        // Reduce chunk timeouts and improve loading
        moduleIds: 'named',
        chunkIds: 'named',
      };

      // Add timeout and retry configuration
      config.output = {
        ...config.output,
        crossOriginLoading: 'anonymous',
        publicPath: '/_next/',
        chunkLoadTimeout: 120000, // 2 minutes
        chunkLoadingGlobal: 'webpackChunkload',
      };
    }

    // Optimize build performance
    config.infrastructureLogging = {
      level: 'error',
    };

    return config;
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
        hostname: 'pub-0de954b1c66740bc9d9ff8ae55acdba5.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'loremipsum.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cms.jibecdn.com',
        port: '',
        pathname: '/**',
      },
      // Common external image domains
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // News image sources
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Common news image domains
      {
        protocol: 'https',
        hostname: 'cdn.mos.cms.futurecdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.futurecdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ap.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.reuters.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cnn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.bbc.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.npr.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scx1.b-cdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.b-cdn.net',
        port: '',
        pathname: '/**',
      },
      // Common news domains (broad patterns)
      {
        protocol: 'https',
        hostname: '**.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimize image loading with aggressive performance settings
    formats: ['image/avif', 'image/webp'], // AVIF first for best compression
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache for maximum performance
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimized device and image sizes for social media use case
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384, 512],
  },
};

export default nextConfig;
