import { MetadataRoute } from 'next'
import { ROBOTS_CONFIG } from '@/config/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ROBOTS_CONFIG.disallowPaths],
      },
    ],
    sitemap: ROBOTS_CONFIG.sitemap,
  }
}

