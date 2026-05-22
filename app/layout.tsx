import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: {
    default: 'Digital Frames AI - Create Beautiful Photo Frames',
    template: '%s | Digital Frames AI',
  },
  description: 'Create stunning photo frames for your events. Upload your photos, choose from beautiful templates, and share your memories.',
  keywords: ['photo frames', 'event photos', 'photo editor', 'frame templates', 'birthday frames', 'wedding frames'],
  authors: [{ name: 'Digital Frames AI' }],
  creator: 'Digital Frames AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Digital Frames AI',
    title: 'Digital Frames AI - Create Beautiful Photo Frames',
    description: 'Create stunning photo frames for your events. Upload your photos, choose from beautiful templates, and share your memories.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Frames AI - Create Beautiful Photo Frames',
    description: 'Create stunning photo frames for your events.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f8f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1918' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <SessionProvider>
          <I18nProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </I18nProvider>
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

