const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ethora/chat-component'],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
  env: {
    ETHORA_CHAT_API_URL: process.env.ETHORA_CHAT_API_URL,
    ETHORA_XMPP_DEV_SERVER: process.env.ETHORA_XMPP_DEV_SERVER,
  },
  // MAR-342: this is a running SDK demo app, not marketing content.
  // Keep it out of search results on every route.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

