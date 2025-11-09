
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
