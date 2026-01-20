"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/Providers";
import { supabase } from "@/lib/supabase";

interface RelevantPost {
  post_id: string;
  title: string;
  content_snippet: string;
  author_name: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  category: string;
}

interface RecommendedUser {
  user_id: string;
  display_name: string;
  attributes: {
    study_abroad_destination?: string;
    university?: string;
    major?: string;
  };
  contribution_score: number;
  icon_url?: string;
}

interface Citation {
  type: 'post' | 'external';
  ref_id: string;
  title: string;
  confidence_level: 'high' | 'medium' | 'low';
}

export default function AiConciergePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [relevantPosts, setRelevantPosts] = useState<RelevantPost[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [mode, setMode] = useState<'grounded' | 'reasoning'>('grounded');
  const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>('medium');

  // ログインチェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // ログイン中または認証確認中の場合は何も表示しない
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログインしていない場合は何も表示しない（リダイレクト中）
  if (!user) {
    return null;
  }

  async function aiSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer("");
    setRelevantPosts([]);
    setRecommendedUsers([]);
    setCitations([]);

    try {
      // セッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("ログインが必要です");
        router.push('/auth/signin');
        return;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question_text: query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "AIコンシェルジュへの問い合わせに失敗しました");
      }

      setAnswer(data.answer_text ?? "");
      setRelevantPosts(data.related_posts || []);
      setRecommendedUsers(data.recommended_users || []);
      setCitations(data.citations || []);
      setMode(data.mode || 'grounded');
      setConfidenceLevel(data.confidence_level || 'medium');
    } catch (e: any) {
      setError(e?.message ?? "AIコンシェルジュへの問い合わせに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AIコンシェルジュ
            </h1>
            <p className="text-sm sm:text-base text-gray-600">過去の投稿や外部の情報を参考にしながら、あなたの質問にAIが回答します</p>
          </div>

          {/* 入力エリア */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              質問を入力
            </label>
            <div className="flex flex-col gap-2 sm:gap-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Ctrl+Enter または Cmd+Enter で送信
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading && query.trim()) {
                    e.preventDefault();
                    aiSearch();
                  }
                }}
                placeholder="留学に関する質問を入力してください...&#10;複数行の入力も可能です。"
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-y min-h-[100px] sm:min-h-[120px] max-h-[300px] font-sans leading-relaxed"
                style={{ fontFamily: 'inherit' }}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {query.length} 文字
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    （Ctrl+Enter または Cmd+Enter で送信）
                  </span>
                </div>
                <button
                  onClick={aiSearch}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 whitespace-nowrap"
                  disabled={loading || !query.trim()}
                  type="button"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>{loading ? "処理中..." : "送信"}</span>
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-3 p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}
          </div>

          {/* 引用できなかった場合のメッセージ */}
          {answer && mode === 'reasoning' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 sm:mb-6 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>RyugakuTalk内の関連投稿が見つかりませんでした。</strong>
                    <br />
                    この回答は一般的な推論に基づいています。より具体的な情報が必要な場合は、質問のキーワードを変更してお試しください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 回答エリア */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
                <span>AIからの回答</span>
              </h2>
              {answer && (
                <div className="flex items-center gap-2">
                  {mode === 'grounded' ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">参照あり</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">推論</span>
                  )}
                  {confidenceLevel === 'high' && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">信頼度高</span>
                  )}
                </div>
              )}
            </div>
            <div className="min-h-[200px] border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 text-xs sm:text-sm bg-gray-50">
              {answer ? (
                <div className="text-gray-800 leading-relaxed prose prose-sm prose-gray max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="ml-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      code: ({node, ...props}) => <code className="bg-gray-200 px-1 rounded text-xs" {...props} />,
                      a: ({node, ...props}) => <a className="text-primary-600 hover:underline" {...props} />,
                    }}
                  >
                    {answer}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-400 flex items-center justify-center h-full">
                  <span>回答が表示されます</span>
                </div>
              )}
            </div>
          </div>

          {/* 引用した投稿 */}
          {relevantPosts.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
                <span>引用した投稿</span>
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {relevantPosts.map((post) => (
                  <Link
                    key={post.post_id}
                    href={`/posts/${post.post_id}`}
                    className="block p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
                  >
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{post.content_snippet}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 flex-wrap gap-1">
                      <span className="truncate">投稿者: {post.author_name}</span>
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* おすすめユーザー */}
          {recommendedUsers.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">おすすめユーザー</h2>
              <div className="space-y-3">
                {recommendedUsers.map((user) => (
                  <Link
                    key={user.user_id}
                    href={`/profile/${user.user_id}`}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.icon_url ? (
                        <img src={user.icon_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-primary-600 font-semibold">{user.display_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{user.display_name}</div>
                      <div className="text-xs text-gray-500">
                        {user.attributes.study_abroad_destination && (
                          <span>{user.attributes.study_abroad_destination}</span>
                        )}
                        {user.attributes.university && (
                          <span> / {user.attributes.university}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">⭐ {user.contribution_score}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

