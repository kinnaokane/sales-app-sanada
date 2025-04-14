/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // App Router が使えるようにする
  },
}

module.exports = nextConfig
