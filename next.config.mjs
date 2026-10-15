/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: '/backend/login', destination: '/login?error=oauth', permanent: false }]
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    return [{ source: '/backend/:path*', destination: `${backendUrl}/:path*` }]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
