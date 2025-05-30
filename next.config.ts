import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  
  ...(process.env.NODE_ENV === "development" && {
    onDemandEntries: {
      maxInactiveAge: 300 * 1000, // 5분으로 대폭 증가
      pagesBufferLength: 20, // 더 많은 페이지 캐시
    },
  }),

  serverExternalPackages: [
    'ioredis', 
    'sharp',
    'redis',
    '@redis/client',
    'generic-pool',
    'cluster',
    'denque'
  ],

  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
  },

  compress: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },

  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (dev) {
      config.watchOptions = {
        ignored: /node_modules/,
        poll: false,
        aggregateTimeout: 15000, // 15초로 대폭 증가!
      };
      config.parallelism = 1;
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        child_process: false,
        cluster: false,
        module: false,
        'node:crypto': false,
        'node:stream': false,
        'node:buffer': false,
        'node:util': false,
        'node:net': false,
        'node:dns': false,
      };
      
      const externals = config.externals || [];
      config.externals = [
        ...externals,
        'ioredis',
        'redis', 
        '@redis/client',
        'generic-pool',
        'cluster',
        'denque'
      ];
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: [
      'ioredis',
      'redis', 
      '@redis/client',
      'generic-pool'
    ]
  }
};

export default nextConfig; 