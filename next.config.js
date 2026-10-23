/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
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
