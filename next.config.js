/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // travelguide.dirt-trails.com should be added as an alias domain in your hosting platform (Vercel, etc.)
      // to serve the same content without redirect.
      // Only redirect www.trip-insights.com to non-www.
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
