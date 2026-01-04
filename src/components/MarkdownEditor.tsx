'use client'

import { useRef, useState } from 'react'
import { 
  Heading1, Heading2, List, ListOrdered, Quote, Image as ImageIcon, 
  Link as LinkIcon, BookOpen, Bold, Italic, Sparkles, Send, X
} from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  onImageSelect?: (file: File) => void
  onImageUploaded?: (url: string, placeholder: string) => void
  uploadedImages?: string[]
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder, 
  rows = 15,
  onImageSelect,
  uploadedImages = []
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [pendingImageIndex, setPendingImageIndex] = useState<number | null>(null)
  const [imageAlt, setImageAlt] = useState('')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [showAIConcierge, setShowAIConcierge] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // カーソル位置にテキストを挿入
  const insertText = (before: string, after: string = '', selectText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textToInsert = before + (selectText || selectedText) + after

    const newValue = value.substring(0, start) + textToInsert + value.substring(end)
    onChange(newValue)

    // カーソル位置を更新
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectText || selectedText).length
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // 見出し大を挿入
  const insertHeading1 = () => {
    insertText('# ', '\n\n', '見出し1')
  }

  // 見出し小を挿入
  const insertHeading2 = () => {
    insertText('## ', '\n\n', '見出し2')
  }

  // 箇条書きリストを挿入
  const insertUnorderedList = () => {
    insertText('- ', '\n', 'リスト項目')
  }

  // 番号付きリストを挿入
  const insertOrderedList = () => {
    insertText('1. ', '\n', 'リスト項目')
  }

  // 引用を挿入
  const insertQuote = () => {
    insertText('> ', '\n', '引用テキスト')
  }

  // 太字を挿入
  const insertBold = () => {
    insertText('**', '**', '太字テキスト')
  }

  // 斜体を挿入
  const insertItalic = () => {
    insertText('*', '*', '斜体テキスト')
  }

  // 画像ファイルを選択
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImageSelect) {
      // 画像を親コンポーネントに渡す
      onImageSelect(file)
      
      // 画像のインデックスを保存（アップロード後にURLを挿入するため）
      const imageIndex = uploadedImages.length
      setPendingImageIndex(imageIndex)
      
      // 代替テキスト入力ダイアログを表示
      setShowImageDialog(true)
      
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  // 画像をMarkdownに挿入（代替テキスト入力後）
  const insertImageMarkdown = () => {
    if (pendingImageIndex !== null) {
      const altText = imageAlt || `画像${pendingImageIndex + 1}`
      // アップロードされた画像のURLを使用（実際のURLは後で置換される）
      const placeholder = `[画像${pendingImageIndex + 1}]`
      insertText(`![${altText}](`, ')', placeholder)
      setShowImageDialog(false)
      setImageAlt('')
      setPendingImageIndex(null)
    }
  }

  // AIコンシェルジュで草案を生成
  const handleAIConcierge = async () => {
    if (!aiQuery.trim() || aiLoading) return

    setAiLoading(true)
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          limit: 100,
          topK: 5,
          mode: 'diary', // 日記作成モード
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error ?? 'AIコンシェルジュへの問い合わせに失敗しました')
      }

      // 生成された草案を内容ボックスに挿入
      const draft = data.answer ?? ''
      if (draft) {
        // 既存の内容がある場合は改行を追加してから挿入
        const newContent = value ? `${value}\n\n${draft}` : draft
        onChange(newContent)
        // ダイアログを閉じる
        setShowAIConcierge(false)
        setAiQuery('')
      }
    } catch (error: any) {
      alert(error?.message ?? 'AIコンシェルジュへの問い合わせに失敗しました')
    } finally {
      setAiLoading(false)
    }
  }

  // URLを挿入
  const insertLink = () => {
    if (linkUrl) {
      const linkLabel = linkText || 'リンクテキスト'
      insertText(`[${linkLabel}](`, ')', linkUrl)
      setShowLinkDialog(false)
      setLinkUrl('')
      setLinkText('')
    }
  }

  // 目次を挿入
  const insertTableOfContents = () => {
    const lines = value.split('\n')
    const headings: string[] = []
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        headings.push(`- [${line.substring(2)}](#heading-${index})`)
      } else if (line.startsWith('## ')) {
        headings.push(`  - [${line.substring(3)}](#heading-${index})`)
      }
    })

    if (headings.length > 0) {
      const toc = '## 目次\n\n' + headings.join('\n') + '\n\n'
      insertText(toc, '')
    } else {
      insertText('## 目次\n\n', '\n\n', '見出しを追加すると自動的に目次が生成されます')
    }
  }

  return (
    <div className="space-y-2">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={insertTableOfContents}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="目次"
        >
          <BookOpen className="h-4 w-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={insertHeading1}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="見出し大"
        >
          <Heading1 className="h-4 w-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={insertHeading2}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="見出し小"
        >
          <Heading2 className="h-4 w-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={insertUnorderedList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="箇条書きリスト"
        >
          <List className="h-4 w-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={insertOrderedList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="番号付きリスト"
        >
          <ListOrdered className="h-4 w-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={insertQuote}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="引用"
        >
          <Quote className="h-4 w-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={insertBold}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="太字"
        >
          <Bold className="h-4 w-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={insertItalic}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="斜体"
        >
          <Italic className="h-4 w-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <label className="p-2 hover:bg-gray-200 rounded transition-colors cursor-pointer" title="画像">
          <ImageIcon className="h-4 w-4 text-gray-700" />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageFileSelect}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowLinkDialog(true)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="URL"
        >
          <LinkIcon className="h-4 w-4 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => setShowAIConcierge(true)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="AIコンシェルジュ"
        >
          <Sparkles className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* テキストエリア */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none font-mono text-sm"
      />

      {/* 画像代替テキスト入力ダイアログ */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">画像の代替テキスト</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  代替テキスト（オプション）
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="画像の説明"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      insertImageMarkdown()
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageDialog(false)
                    setImageAlt('')
                    setPendingImageIndex(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={insertImageMarkdown}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  挿入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL挿入ダイアログ */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">リンクを挿入</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リンクテキスト（オプション）
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="表示するテキスト"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkDialog(false)
                    setLinkUrl('')
                    setLinkText('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  disabled={!linkUrl}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  挿入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AIコンシェルジュダイアログ */}
      {showAIConcierge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                AIコンシェルジュ
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAIConcierge(false)
                  setAiQuery('')
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リクエストを入力してください
                </label>
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="例: 記事の構成を考えてほしい、今日の出来事を日記形式で書いてほしい"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey && !aiLoading && aiQuery.trim()) {
                      handleAIConcierge()
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ctrl+Enter で送信
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAIConcierge(false)
                    setAiQuery('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleAIConcierge}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>送信</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
