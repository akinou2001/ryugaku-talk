import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ryugaku Talk',
  description: '留学生と留学希望者をつなぐSNS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`bg-gray-50 text-gray-900 ${inter.className}`}>
        <Header />
        <main className="max-w-4xl mx-auto p-6">{children}</main>
        <footer className="text-center text-gray-400 text-sm py-4">
          &copy; 2025 Ryugaku Talk
        </footer>
      </body>
    </html>
  );
}

