/** @type {import('next').NextConfig} */
/* Proxy /api/* → Django: `src/app/api/[...path]/route.ts` (evita bucles 301 con rewrites). */

/**
 * Origen del API sin sufijo /api (para next/image remotePatterns).
 * Usa INTERNAL_API_URL o NEXT_PUBLIC_API_URL definidos en .env.
 */
function imageRemotePatternsFromEnv() {
  const raw = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw || !String(raw).trim()) return [];
  try {
    const base = String(raw).replace(/\/$/, '').replace(/\/api\/?$/i, '');
    const u = new URL(base.startsWith('http') ? base : `http://${base}`);
    const protocol = u.protocol === 'https:' ? 'https' : 'http';
    const entry = {
      protocol,
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
    };
    return [entry];
  } catch {
    return [];
  }
}

const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  output: 'standalone',

  images: {
    remotePatterns: imageRemotePatternsFromEnv(),
  },

  async redirects() {
    return [
      {
        source: '/dashboard/dashboard',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
