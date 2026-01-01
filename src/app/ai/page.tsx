"use client";

import { useState } from "react";
import { Sparkles, MessageSquare, BookOpen, HelpCircle } from "lucide-react";

export default function AiConciergePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'chat' | 'diary' | 'question'>('chat');

  async function aiSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit: 100,
          topK: 5,
          mode, // モードを追加
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "AIコンシェルジュへの問い合わせに失敗しました");
      }

      setAnswer(data.answer ?? "");
    } catch (e: any) {
      setError(e?.message ?? "AIコンシェルジュへの問い合わせに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AIコンシェルジュ
            </h1>
            <p className="text-gray-600">過去ログを学習したAIが、あなたの質問に答えたり、日記作成をサポートします</p>
          </div>

          {/* モード選択 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              利用モード
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setMode('chat')}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  mode === 'chat'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>チャット</span>
              </button>
              <button
                onClick={() => setMode('diary')}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  mode === 'diary'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span>日記作成</span>
              </button>
              <button
                onClick={() => setMode('question')}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  mode === 'question'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <HelpCircle className="h-5 w-5" />
                <span>質問サポート</span>
              </button>
            </div>
          </div>

          {/* 入力エリア */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'chat' ? '質問を入力' : mode === 'diary' ? '日記の内容を入力' : '質問内容を入力'}
            </label>
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && query.trim() && aiSearch()}
                placeholder={mode === 'chat' ? '何でも聞いてください...' : mode === 'diary' ? '今日の出来事を入力...' : '質問内容を入力...'}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button
                onClick={aiSearch}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                disabled={loading || !query.trim()}
                type="button"
              >
                <Sparkles className="h-5 w-5" />
                <span>{loading ? "処理中..." : "送信"}</span>
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* 回答エリア */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <span>AIからの回答</span>
            </h2>
            <div className="min-h-[200px] border-2 border-gray-200 rounded-xl p-6 text-sm whitespace-pre-wrap bg-gray-50">
              {answer ? (
                <div className="text-gray-800 leading-relaxed">{answer}</div>
              ) : (
                <div className="text-gray-400 flex items-center justify-center h-full">
                  <span>回答が表示されます</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
