import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXTAUTH_URL || 'https://ai-frame-generation.vercel.app'
  
  // 1. Static Pages
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/pricing',
    '/gallery',
    '/terms',
    '/privacy',
    '/cookies'
  ]

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // 2. Dynamic Shared Frames Pages
  let shareEntries: MetadataRoute.Sitemap = []
  
  try {
    const supabase = createAdminClient()
    const { data: exports, error } = await supabase
      .from('exports')
      .select('id, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (!error && exports) {
      shareEntries = exports.map((exp) => ({
        url: `${siteUrl}/share/${exp.id}`,
        lastModified: new Date(exp.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error generating sitemap dynamic routes:', error)
  }

  return [...staticEntries, ...shareEntries]
}
