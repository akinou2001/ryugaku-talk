"use client";

import { useState, useEffect } from "react";
import { X, Search, Trash2, MessageSquare, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ChatHistory {
  id: string;
  question_text: string;
  answer_text: string;
  mode: 'grounded' | 'reasoning';
  confidence_level: 'high' | 'medium' | 'low';
  related_posts: any[];
  created_at: string;
}

interface AIConciergeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chat: ChatHistory) => void;
  currentChatId?: string;
}

export function AIConciergeSidebar({
  isOpen,
  onClose,
  onSelectChat,
  currentChatId
}: AIConciergeSidebarProps) {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // チャット履歴を取得
  const fetchChatHistory = async (search: string = "") => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChats([]);
        setFilteredChats([]);
        return;
      }

      const url = new URL("/api/ai/concierge/history", window.location.origin);
      if (search) {
        url.searchParams.set("search", search);
      }
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Chat history fetched successfully:", data.chats?.length || 0, "chats");
        setChats(data.chats || []);
        setFilteredChats(data.chats || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch chat history:", {
          status: res.status,
          statusText: res.statusText,
          error: errorData.error || 'Unknown error'
        });
        setChats([]);
        setFilteredChats([]);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setChats([]);
      setFilteredChats([]);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時と検索クエリ変更時に履歴を取得
  useEffect(() => {
    if (isOpen) {
      fetchChatHistory(searchQuery);
    }
  }, [isOpen, searchQuery]);

  // チャット履歴を削除
  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素のクリックイベントを防ぐ
    
    if (!confirm("このチャット履歴を削除しますか？")) {
      return;
    }

    setDeletingId(chatId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("ログインが必要です");
        return;
      }

      const res = await fetch(`/api/ai/concierge/history?id=${chatId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        // 削除後に履歴を再取得
        await fetchChatHistory(searchQuery);
        // 削除したチャットが現在選択されている場合は、サイドバーを閉じる
        if (currentChatId === chatId) {
          onClose();
        }
      } else {
        alert("削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // 質問テキストを短縮
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      {/* オーバーレイ（モバイル用） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none lg:border-r lg:border-gray-200
        `}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              <span>チャット履歴</span>
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="サイドバーを閉じる"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* 検索バー */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="履歴を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* チャット履歴リスト */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">
                  {searchQuery ? "検索結果がありません" : "チャット履歴がありません"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat);
                      onClose(); // モバイルでは選択後にサイドバーを閉じる
                    }}
                    className={`
                      p-4 cursor-pointer hover:bg-gray-50 transition-colors
                      ${currentChatId === chat.id ? "bg-primary-50 border-l-4 border-primary-600" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                          {truncateText(chat.question_text, 60)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(chat.created_at)}</span>
                          {chat.mode === 'grounded' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              参照あり
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(chat.id, e)}
                        disabled={deletingId === chat.id}
                        className="flex-shrink-0 p-1.5 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="削除"
                      >
                        {deletingId === chat.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
