'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md py-4 px-6 mb-8">
      <nav className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Ryugaku Talk</h1>
        <div className="flex gap-4">
          <Link href="/consult" className="text-sm hover:underline">相談一覧</Link>
          <Link href="/consult/new" className="text-sm hover:underline">相談投稿</Link>
        </div>
      </nav>
    </header>
  );
}
