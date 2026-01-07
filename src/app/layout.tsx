import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { AIConciergeButton } from '@/components/AIConciergeButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RyugakuTalk - 留学支援コミュニティ',
  description: '留学中・留学希望者・関係者が質問・共有・交流できる安全なオンラインコミュニティ',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
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


