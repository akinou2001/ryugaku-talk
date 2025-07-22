

// ホームページのコンポーネント
// src/app/page.tsx
export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-3xl font-bold">Ryugaku Talk</h1>
      <p className="text-center max-w-md">
        エヴァ活したい留学生が集まるSNS
      </p>
      <div className="flex gap-4">
        <a href="/consult" className="bg-blue-600 text-white px-4 py-2 rounded">相談一覧を見る</a>
        <a href="/consult/new" className="bg-green-600 text-white px-4 py-2 rounded">相談を投稿する</a>
      </div>
    </main>
  );
}
