import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/monkeylink', '/katalog2', '/login', '/registrace', '/zona', '/nabidka'],
    },
    sitemap: 'https://biketime.cz/sitemap.xml',
  };
}
