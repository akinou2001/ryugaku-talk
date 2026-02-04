import { MetadataRoute } from 'next'
import { SITEMAP_CONFIG } from '@/config/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_CONFIG.staticRoutes.map((route) => ({
    url: `${SITEMAP_CONFIG.baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? SITEMAP_CONFIG.changeFrequency.home : SITEMAP_CONFIG.changeFrequency.other,
    priority: route === '' ? SITEMAP_CONFIG.priority.home : SITEMAP_CONFIG.priority.other,
  }))
}

