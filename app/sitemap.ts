import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/privacy', '/terms', '/support'].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
}
