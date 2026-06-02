import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXTAUTH_URL || 'https://ai-frame-generation.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/auth/'
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  }
}
