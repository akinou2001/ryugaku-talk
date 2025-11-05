'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FaUser, FaGlobeAsia, FaHeading, FaCommentDots } from "react-icons/fa";

export default function NewConsultPage() {
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !name || !country || !content) {
      setError('すべての項目を入力してください。');
      return;
    }

    await addDoc(collection(db, 'consults'), {
      title,
      name,
      country,
      content,
      createdAt: serverTimestamp(), // ← ここで追加！
    });

    router.push('/consult');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-16 px-4">
      <div className="card w-full max-w-md sm:max-w-lg md:max-w-xl px-4 sm:px-8 md:px-12 py-8 md:py-12 mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-10 text-center tracking-tight drop-shadow">
          相談を投稿する
        </h2>
        {error && <p className="text-red-500 mb-6 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          {/* タイトル */}
          <div className="relative">
            <FaHeading size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              type="text"
              placeholder="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-white/80 shadow focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            />
          </div>
          {/* 名前 */}
          <div className="relative">
            <FaUser size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              type="text"
              placeholder="名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-white/80 shadow focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            />
          </div>
          {/* 希望留学先 */}
          <div className="relative">
            <FaGlobeAsia size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              type="text"
              placeholder="希望留学先（国名）"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-white/80 shadow focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            />
          </div>
          {/* 相談内容 */}
          <div className="relative">
            <FaCommentDots size={20} className="absolute left-4 top-6 text-blue-400" />
            <textarea
              placeholder="相談内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-white/80 shadow focus:ring-2 focus:ring-blue-200 focus:outline-none transition resize-none h-32"
            />
          </div>
          {/* 送信ボタン */}
          <button
            type="submit"
            className="button-accent w-full py-3 text-lg font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:from-blue-600 hover:to-purple-600 transition shadow-lg rounded-full mt-2"
          >
            <span className="tracking-wide">投稿する</span>
          </button>
        </form>
      </div>
    </main>
  );
}
