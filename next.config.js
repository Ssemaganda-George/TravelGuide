/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Redirect old domain to new domain (301 permanent)
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'travelguide.dirt-trails.com' },
        ],
        destination: 'https://trip-insights.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.travelguide.dirt-trails.com' },
        ],
        destination: 'https://trip-insights.com/:path*',
        permanent: true,
      },
      // Redirect www to non-www for new domain
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.trip-insights.com' },
        ],
        destination: 'https://trip-insights.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
