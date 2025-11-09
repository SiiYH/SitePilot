
import type {NextConfig} from 'next';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
            to: path.join(__dirname, 'public'),
          },
        ],
      })
    );
    
    // This is the crucial part to prevent the worker from being bundled on the server.
    if (isServer) {
        config.externals.push('pdfjs-dist/build/pdf.worker.min.mjs');
    }

    return config;
  },
  /* async rewrites() {
    return [
      {
        source: '/_workstation/:path*',
        destination: 'http://localhost:3000/_workstation/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3000/auth/:path*', // proxy /auth as well
      },
    ];
  } */
  
};


export default nextConfig;
