import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { ThemeProvider } from '@/components/theme-provider'
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
    default: 'Event Frames - Create Beautiful Photo Frames',
    template: '%s | Event Frames',
  },
  description: 'Create stunning photo frames for your events. Upload your photos, choose from beautiful templates, and share your memories.',
  keywords: ['photo frames', 'event photos', 'photo editor', 'frame templates', 'birthday frames', 'wedding frames'],
  authors: [{ name: 'Event Frames' }],
  creator: 'Event Frames',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Event Frames',
    title: 'Event Frames - Create Beautiful Photo Frames',
    description: 'Create stunning photo frames for your events. Upload your photos, choose from beautiful templates, and share your memories.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Event Frames - Create Beautiful Photo Frames',
    description: 'Create stunning photo frames for your events.',
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
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

import { SplashScreen } from '@/components/ui/splash-screen'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider>
              <SplashScreen />
              {children}
              <Toaster position="bottom-right" richColors />
            </I18nProvider>
          </ThemeProvider>
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

