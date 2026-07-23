const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..'),
  transpilePackages: [
    '@x402/core',
    '@x402/evm',
    '@x402/extensions',
    '@x402/svm',
    '@coinbase/cdp-sdk',
  ],

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/storage/:path*',
        destination: 'https://storage.aishi.app/api/storage/:path*',
      },
    ];
  },

  serverExternalPackages: [
    '@0glabs/0g-ts-sdk',
    'crypto',
    'fs',
    'stream',
    'buffer',
    'util',
    'assert',
    'http',
    'https',
    'os',
    'url',
    'path',
  ],

  ...(process.env.ANALYZE === 'true' && {
    bundleAnalyzer: {
      enabled: true,
    },
  }),

  compress: true,
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_COMPUTE_API_URL: process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_DREAM_TEST: process.env.NEXT_PUBLIC_DREAM_TEST || 'true',
    MEMORY_DEEP_ACTIVE: process.env.MEMORY_DEEP_ACTIVE || 'false',
  },

  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/System Volume Information/**',
        '**/pagefile.sys',
      ],
    };

    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });

    if (!isServer) {
      const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
      config.plugins.push(
        new NodePolyfillPlugin({
          excludeAliases: ['console', 'http', 'https', 'domain'],
        })
      );
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
      'node:fs': false,
      'node:fs/promises': false,
      'node:crypto': require.resolve('crypto-browserify'),
      'node:stream': require.resolve('stream-browserify'),
      'node:buffer': require.resolve('buffer'),
      'node:util': require.resolve('util'),
      'node:assert': require.resolve('assert'),
      'node:http': require.resolve('stream-http'),
      'node:https': require.resolve('https-browserify'),
      'node:os': require.resolve('os-browserify/browser'),
      'node:url': require.resolve('url'),
      'node:path': require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      assert: require.resolve('assert'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      url: require.resolve('url'),
      path: require.resolve('path-browserify'),
    };

    config.plugins.push(
      new (require('webpack')).ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'node:crypto': 'crypto-browserify',
      'node:fs': false,
      'node:fs/promises': false,
      'node:stream': 'stream-browserify',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:assert': 'assert',
      'node:http': 'stream-http',
      'node:https': 'https-browserify',
      'node:os': 'os-browserify/browser',
      'node:url': 'url',
      'node:path': 'path-browserify',
    };

    config.module.rules.push({
      test: /\.(m?js|ts|tsx)$/,
      resolve: {
        fullySpecified: false,
      },
    });

    config.plugins.push(
      new (require('webpack')).NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );

    return config;
  },
};

module.exports = nextConfig;
