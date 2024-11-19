/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    // Enables the styled-components plugin
    styledComponents: true,
  },
  // Enable App Router
  experimental: { 
  },
}

module.exports = nextConfig