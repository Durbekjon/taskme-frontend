import type { NextConfig } from "next";

/**
 * Optional dev proxy.
 *
 * Set API_PROXY_TARGET (e.g. http://localhost:4000) and the app serves the API
 * from its own origin at /api. That makes it possible to expose the whole
 * stack through a single tunnel - useful for testing on a phone - and it
 * sidesteps CORS because the requests are same-origin.
 *
 * Leave it unset for normal local development; the clients then talk to
 * NEXT_PUBLIC_API_URL directly.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig: NextConfig = {
  // Enable standalone output for Docker (copies only the files needed to run)
  output: 'standalone',

  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiProxyTarget}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
