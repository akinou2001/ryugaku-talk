// src/app/consult/[id]/page.tsx
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function ConsultDetailPage({ params }: Props) {
  const { id } = params;
  const docRef = doc(db, 'consults', id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    notFound();
  }

  const data = snap.data();

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{data.title}</h2>
      <p className="text-gray-600 mb-2">投稿者: {data.name}</p>
      <p className="text-gray-600 mb-2">留学希望国: {data.country}</p>
      <p className="whitespace-pre-wrap">{data.content}</p>
    </main>
  );
}



