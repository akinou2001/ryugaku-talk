// src/app/consult/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';

export default function ConsultListPage() {
  const [consults, setConsults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'consults'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConsults(data);
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-10 text-center tracking-tight drop-shadow">
          相談一覧
        </h2>
        <ul className="flex flex-col gap-8 list-none">
          {consults.map((consult) => (
            <li
              key={consult.id}
              className="card p-6 flex flex-col gap-2 min-h-[180px] relative"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-1">{consult.title}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                <span>投稿者: {consult.name}</span>
                {consult.country && <span>希望国: {consult.country}</span>}
              </div>
              <div className="text-gray-700 mb-2 line-clamp-2">
                {consult.content?.length > 80
                  ? consult.content.substring(0, 80) + '...'
                  : consult.content}
              </div>
              <div className="flex justify-end mt-4">
                <Link
                  href={`/consult/${consult.id}`}
                  className="button-accent px-6 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:from-blue-600 hover:to-purple-600 transition shadow rounded-full"
                >
                  詳細を見る
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}


  