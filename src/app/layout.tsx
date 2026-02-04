import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { AIConciergeButton } from '@/components/AIConciergeButton'
import { APP_ICONS } from '@/config/app-icons'
import { 
  APP_NAME, 
  APP_DESCRIPTION, 
  APP_DESCRIPTION_SHORT, 
  APP_SUBTITLE, 
  DEFAULT_TITLE, 
  TITLE_TEMPLATE 
} from '@/config/app-config'
import { 
  SITE_URL, 
  SITE_LOCALE, 
  SEO_KEYWORDS, 
  OG_IMAGE, 
  APPLE_ICON, 
  FAVICON 
} from '@/config/site-config'
import { TWITTER } from '@/config/social-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} - ${APP_DESCRIPTION_SHORT}`,
    description: APP_DESCRIPTION_SHORT,
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: TWITTER.cardType,
    title: `${APP_NAME} - ${APP_DESCRIPTION_SHORT}`,
    description: APP_DESCRIPTION_SHORT,
    images: [OG_IMAGE.url],
    creator: TWITTER.handle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: FAVICON.url, sizes: FAVICON.sizes, type: FAVICON.type },
      { url: APP_ICONS.favicon, type: 'image/svg+xml' },
    ],
    apple: [
      { url: APPLE_ICON.url, sizes: APPLE_ICON.sizes, type: APPLE_ICON.type },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/twemoji@latest/dist/twemoji.css" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <AIConciergeButton />
            <FloatingActionButton />
          </div>
        </Providers>
      </body>
    </html>
  )
}


