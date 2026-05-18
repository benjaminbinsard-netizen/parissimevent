/** @type {import('next').NextConfig} */
const nextConfig = {
  // The marketing site is kept byte-for-byte as a static asset
  // (public/site.html) so its hand-tuned CSS/JS is never altered by a
  // JSX migration. We just rewrite "/" to it. The dashboard (/admin)
  // and the API (/api/*) are real Next.js routes.
  async rewrites() {
    return [
      { source: '/', destination: '/site.html' },
      // Pas de .ico binaire : on sert l'icône SVG pour la requête
      // implicite /favicon.ico des navigateurs et crawlers.
      { source: '/favicon.ico', destination: '/favicon.svg' },
    ];
  },
};

module.exports = nextConfig;
