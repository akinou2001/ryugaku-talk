"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/UserAvatar";

interface RelevantPost {
  post_id: string;
  title: string;
  content_snippet: string;
  author_name: string;
  author_icon_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  category: string;
}

export default function AiSearchEnhancedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [relevantPosts, setRelevantPosts] = useState<RelevantPost[]>([]);
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
    setLoadingStep("投稿を検索中...");

    try {
      // セッションからアクセストークンを取得
      setLoadingStep("認証を確認中...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("ログインが必要です");
        router.push('/auth/signin');
        return;
      }

      setLoadingStep("関連する投稿を検索中...");
      // 少し待ってから次のステップに進む（UX向上のため）
      await new Promise(resolve => setTimeout(resolve, 300));

      setLoadingStep("AIが回答を生成中...");
      const res = await fetch("/api/ai/search-enhanced", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question_text: query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "AI検索への問い合わせに失敗しました");
      }

      setLoadingStep("回答を整理中...");
      // 少し待ってから結果を表示（スムーズな表示のため）
      await new Promise(resolve => setTimeout(resolve, 200));

      setAnswer(data.answer_text ?? "");
      setRelevantPosts(data.related_posts || []);
      setMode(data.mode || 'grounded');
      setConfidenceLevel(data.confidence_level || 'medium');
    } catch (e: any) {
      setError(e?.message ?? "AI検索への問い合わせに失敗しました");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              AIコンシェルジュ（拡張版）
            </h1>
            <p className="text-sm sm:text-base text-gray-600">投稿データベースから関連情報を検索し、要約・引用しながら回答します</p>
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
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 whitespace-nowrap relative"
                  disabled={loading || !query.trim()}
                  type="button"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      <span>処理中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span>送信</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-3 p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}
          </div>


          {/* 回答エリア */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" />
                <span>AIからの回答</span>
              </h2>
            </div>
            <div className="min-h-[200px] border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 text-xs sm:text-sm bg-gray-50">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-primary-600 font-semibold text-sm sm:text-base animate-pulse">
                      {loadingStep || "処理中..."}
                    </p>
                    <p className="text-gray-500 text-xs">
                      しばらくお待ちください
                    </p>
                  </div>
                  {/* スケルトンローディング */}
                  <div className="w-full space-y-3 mt-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                  </div>
                </div>
              ) : answer ? (() => {
                // 引用番号をMarkdownリンクに変換
                let processedAnswer = answer;
                const citationMap = new Map<number, string>();
                
                relevantPosts.forEach((post, index) => {
                  const citationNum = index + 1;
                  citationMap.set(citationNum, post.post_id);
                  // [1], [2]などの引用番号をMarkdownリンクに変換
                  const citationPattern = new RegExp(`\\[${citationNum}\\]`, 'g');
                  processedAnswer = processedAnswer.replace(
                    citationPattern,
                    `[${citationNum}](/posts/${post.post_id})`
                  );
                });
                
                return (
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
                        a: ({node, ...props}) => {
                          // 引用番号のリンクに特別なスタイルを適用
                          const href = props.href || '';
                          const linkText = props.children?.toString() || '';
                          const isCitation = /^\/posts\/.+$/.test(href) && /^\d+$/.test(linkText);
                          
                          if (isCitation) {
                            // 引用番号のリンク
                            const post = relevantPosts.find(p => href.includes(p.post_id));
                            return (
                              <Link
                                href={href}
                                className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-xs font-semibold text-primary-600 bg-primary-100 rounded-full hover:bg-primary-200 hover:text-primary-700 transition-colors"
                                title={post ? `投稿: ${post.title}` : '投稿を開く'}
                              >
                                {linkText}
                              </Link>
                            );
                          } else {
                            // 通常のリンク
                            return (
                              <a className="text-primary-600 hover:underline" href={href} {...props}>
                                {props.children}
                              </a>
                            );
                          }
                        },
                      }}
                    >
                      {processedAnswer}
                    </ReactMarkdown>
                  </div>
                );
              })() : (
                <div className="text-gray-400 flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <span className="text-sm">回答が表示されます</span>
                  </div>
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
              <div className="space-y-2 sm:space-y-3">
                {relevantPosts.map((post, index) => {
                  const isChat = post.category === 'chat';
                  
                  return (
                    <Link
                      key={post.post_id}
                      href={`/posts/${post.post_id}`}
                      className="flex items-center gap-3 p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
                    >
                      {/* 番号バッジ */}
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                        {index + 1}
                      </div>
                      
                      {/* 投稿者アイコン */}
                      <div className="flex-shrink-0">
                        <UserAvatar
                          iconUrl={post.author_icon_url}
                          name={post.author_name}
                          size="md"
                        />
                      </div>
                      
                      {/* 投稿情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {post.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-600 truncate">
                            {post.author_name}
                          </span>
                        </div>
                        {/* つぶやきの場合は1行のみ表示 */}
                        {isChat && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                            {post.content_snippet}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

