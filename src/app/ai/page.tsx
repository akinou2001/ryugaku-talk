"use client";

import { useState } from "react";

export default function AiPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(""); // ✅ 改：用 string 存结果文本
  const [error, setError] = useState<string | null>(null);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "AI search failed");
      }

      // ✅ 后端返回 { answer: string }
      setAnswer(data.answer ?? "");
    } catch (e: any) {
      setError(e?.message ?? "AI search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">AI検索beta</h1>

        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            検索クエリ
          </label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索語を入力"
              className="input-field flex-1"
            />
            <button
              onClick={aiSearch}
              className="btn-primary"
              disabled={loading || !query.trim()}
              type="button"
            >
              {loading ? "検索中..." : "AIで検索"}
            </button>
          </div>

          {error && <div className="text-red-600 mt-3">{error}</div>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">検索結果</h2>

            <div className="min-h-[120px] border rounded p-3 text-sm whitespace-pre-wrap">
            {answer ? (
                <span className="text-gray-800">{answer}</span>
            ) : (
                <span className="text-gray-400">結果がありません</span>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
