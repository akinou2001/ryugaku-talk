"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Link as LinkIcon, Menu, Send, Plus, X, AlertTriangle, Shield, BookOpen, Brain } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/UserAvatar";
import { AIConciergeSidebar } from "@/components/AIConciergeSidebar";

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

interface ChatHistory {
  id: string;
  question_text: string;
  answer_text: string;
  mode: 'grounded' | 'reasoning';
  confidence_level: 'high' | 'medium' | 'low';
  related_posts: any[];
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  relatedPosts?: RelevantPost[];
  mode?: 'grounded' | 'reasoning';
  confidenceLevel?: 'high' | 'medium' | 'low';
  timestamp: Date;
}

const SAMPLE_QUESTIONS = [
  "アメリカの大学に留学するにはどんな準備が必要？",
  "留学先での住居はどうやって探す？",
  "留学中のアルバイトは可能？",
  "TOEFL/IELTSのスコアはどのくらい必要？",
];

const MONTHLY_LIMIT = 10;

export default function AiConciergePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // デスクトップではサイドバーを常に表示
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ログインチェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // 残り回数を取得
  const fetchRemainingCount = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/ai/concierge/usage", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setRemainingCount(data.remaining);
      }
    } catch (e) {
      console.error("Failed to fetch usage:", e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRemainingCount();
    }
  }, [user, fetchRemainingCount]);

  // メッセージが更新されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // textareaの高さを自動調整
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

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

  // 新しい会話を開始
  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setCurrentChatId(undefined);
  };

  async function sendMessage(questionOverride?: string) {
    const messageText = questionOverride || input.trim();
    if (!messageText || loading) return;

    // レート制限チェック
    if (remainingCount !== null && remainingCount <= 0) {
      setError("今月の利用回数の上限（10回）に達しました。来月にリセットされます。");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    setLoadingStep("関連する投稿を検索中...");

    try {
      // セッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("ログインが必要です");
        router.push('/auth/signin');
        return;
      }

      setLoadingStep("AIが回答を生成中...");
      const res = await fetch("/api/ai/search-enhanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question_text: messageText }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data?.remaining !== undefined) {
          setRemainingCount(data.remaining);
        }
        throw new Error(data?.error ?? "AIコンシェルジュへの問い合わせに失敗しました");
      }

      // 残り回数を更新
      if (data.remaining !== undefined) {
        setRemainingCount(data.remaining);
      }

      const answerText = data.answer_text ?? "";
      const relatedPosts = data.related_posts || [];
      const chatMode = data.mode || 'grounded';
      const chatConfidence = data.confidence_level || 'medium';

      // AIの回答を追加
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answerText,
        relatedPosts: relatedPosts,
        mode: chatMode,
        confidenceLevel: chatConfidence,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // チャット履歴を自動保存
      try {
        const saveRes = await fetch("/api/ai/concierge/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            question_text: messageText,
            answer_text: answerText,
            mode: chatMode,
            confidence_level: chatConfidence,
            related_posts: relatedPosts
          })
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          if (saveData.chat?.id) {
            setCurrentChatId(saveData.chat.id);
          }
        }
      } catch (saveError) {
        console.error("Failed to save chat history:", saveError);
      }
    } catch (e: any) {
      setError(e?.message ?? "AIコンシェルジュへの問い合わせに失敗しました");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  // チャット履歴を選択したときの処理
  const handleSelectChat = (chat: ChatHistory) => {
    setMessages([
      {
        id: `user-${chat.id}`,
        role: 'user',
        content: chat.question_text,
        timestamp: new Date(chat.created_at)
      },
      {
        id: `assistant-${chat.id}`,
        role: 'assistant',
        content: chat.answer_text,
        relatedPosts: chat.related_posts || [],
        mode: chat.mode,
        confidenceLevel: chat.confidence_level,
        timestamp: new Date(chat.created_at)
      }
    ]);
    setCurrentChatId(chat.id);
    setError(null);
  }

  // 引用番号をMarkdownリンクに変換
  const processAnswer = (answer: string, relatedPosts: RelevantPost[] = []) => {
    let processedAnswer = answer;
    relatedPosts.forEach((post, index) => {
      const citationNum = index + 1;
      const citationPattern = new RegExp(`\\[${citationNum}\\]`, 'g');
      processedAnswer = processedAnswer.replace(
        citationPattern,
        `[${citationNum}](/posts/${post.post_id})`
      );
    });
    return processedAnswer;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceBadge = (level?: string) => {
    switch (level) {
      case 'high':
        return { label: '信頼度: 高', color: 'bg-green-100 text-green-700', icon: Shield };
      case 'medium':
        return { label: '信頼度: 中', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
      case 'low':
        return { label: '信頼度: 低', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
      default:
        return null;
    }
  };

  const getModeBadge = (mode?: string) => {
    switch (mode) {
      case 'grounded':
        return { label: '投稿参照', color: 'bg-blue-100 text-blue-700', icon: BookOpen };
      case 'reasoning':
        return { label: '一般知識', color: 'bg-purple-100 text-purple-700', icon: Brain };
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <AIConciergeSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectChat={handleSelectChat}
          currentChatId={currentChatId}
        />

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ヘッダー */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="サイドバーを開く"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">AIコンシェルジュ</h1>
                  <p className="text-xs text-gray-500">留学に関する質問にAIが回答します</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 残り回数表示 */}
              {remainingCount !== null && (
                <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  remainingCount <= 0
                    ? 'bg-red-100 text-red-700'
                    : remainingCount <= 3
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  残り {remainingCount}/{MONTHLY_LIMIT} 回
                </div>
              )}
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">新しい会話</span>
              </button>
            </div>
          </div>

          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto bg-gray-50" role="log" aria-live="polite">
            <div className="max-w-4xl mx-auto px-4 py-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center max-w-lg">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="h-10 w-10 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">AIコンシェルジュへようこそ</h2>
                    <p className="text-gray-600 mb-8">
                      留学に関する質問を入力してください。投稿データベースから関連情報を検索し、要約・引用しながら回答します。
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SAMPLE_QUESTIONS.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(question)}
                          className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-primary-300 transition-colors text-sm text-gray-700"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const showAvatar = !isUser || index === 0 || messages[index - 1].role === 'assistant';

                    return (
                      <div
                        key={message.id}
                        className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
                      >
                        {/* アバター */}
                        {showAvatar && (
                          <div className="flex-shrink-0">
                            {isUser ? (
                              <UserAvatar
                                iconUrl={user?.icon_url}
                                name={user?.name || ''}
                                size="md"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                        {!showAvatar && <div className="w-10 h-10 flex-shrink-0" />}

                        {/* メッセージコンテンツ */}
                        <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                              isUser
                                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            {isUser ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            ) : (
                              <div className="text-sm leading-relaxed prose prose-sm prose-gray max-w-none">
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
                                      const href = props.href || '';
                                      const linkText = props.children?.toString() || '';
                                      const isCitation = /^\/posts\/.+$/.test(href) && /^\d+$/.test(linkText);

                                      if (isCitation) {
                                        const post = message.relatedPosts?.find(p => href.includes(p.post_id));
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
                                        return (
                                          <a className="text-primary-600 hover:underline" href={href} {...props}>
                                            {props.children}
                                          </a>
                                        );
                                      }
                                    },
                                  }}
                                >
                                  {processAnswer(message.content, message.relatedPosts)}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* モード・信頼度バッジ */}
                          {!isUser && (message.mode || message.confidenceLevel) && (
                            <div className="flex items-center gap-2 mt-2 max-w-[85%]">
                              {(() => {
                                const modeBadge = getModeBadge(message.mode);
                                if (!modeBadge) return null;
                                const ModeIcon = modeBadge.icon;
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${modeBadge.color}`}>
                                    <ModeIcon className="h-3 w-3" />
                                    {modeBadge.label}
                                  </span>
                                );
                              })()}
                              {(() => {
                                const confBadge = getConfidenceBadge(message.confidenceLevel);
                                if (!confBadge) return null;
                                const ConfIcon = confBadge.icon;
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${confBadge.color}`}>
                                    <ConfIcon className="h-3 w-3" />
                                    {confBadge.label}
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {/* 引用した投稿 */}
                          {!isUser && message.relatedPosts && message.relatedPosts.length > 0 && (
                            <RelatedPostsList posts={message.relatedPosts} />
                          )}

                          {/* タイムスタンプ */}
                          <div className={`mt-1 text-xs text-gray-500 ${isUser ? 'text-right' : ''}`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ローディング表示 */}
                  {loading && (
                    <div className="flex items-start gap-4" role="status" aria-label="回答を生成中">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <span className="ml-2 text-xs text-gray-500">{loadingStep || "処理中..."}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* 入力エリア（下部固定） */}
          <div className="bg-white border-t border-gray-200 px-4 py-4">
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-3 p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                    aria-label="エラーを閉じる"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !loading && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="メッセージを入力... (Enterで送信、Shift+Enterで改行)"
                    rows={1}
                    className="w-full px-4 py-3 pr-12 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32 overflow-y-auto"
                    style={{ minHeight: '48px' }}
                    aria-label="質問を入力"
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  aria-label="送信"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                回答は投稿データベースから検索した情報に基づいています
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 引用投稿リスト（展開/折りたたみ対応）
function RelatedPostsList({ posts }: { posts: RelevantPost[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayPosts = expanded ? posts : posts.slice(0, 3);
  const hasMore = posts.length > 3;

  return (
    <div className="mt-3 space-y-2 max-w-[85%]">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <LinkIcon className="h-3 w-3" />
        <span>引用した投稿 ({posts.length}件)</span>
      </div>
      {displayPosts.map((post, idx) => (
        <Link
          key={post.post_id}
          href={`/posts/${post.post_id}`}
          className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
            {idx + 1}
          </div>
          <span className="truncate text-gray-700">{post.title}</span>
        </Link>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center py-1.5 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          {expanded ? '折りたたむ' : `他 ${posts.length - 3} 件を表示`}
        </button>
      )}
    </div>
  );
}
