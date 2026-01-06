'use client'

import { useState } from 'react'
import { X, Flag, AlertTriangle } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string, description: string) => Promise<void>
  type: 'post' | 'comment'
  itemTitle?: string
}

const REPORT_REASONS = [
  { value: 'spam', label: 'スパム・宣伝', description: '不適切な宣伝やスパム投稿' },
  { value: 'harassment', label: 'ハラスメント', description: 'いじめ、嫌がらせ、脅迫' },
  { value: 'inappropriate', label: '不適切な内容', description: '暴力的、性的、差別的な内容' },
  { value: 'misinformation', label: '誤情報', description: '誤った情報やデマの拡散' },
  { value: 'copyright', label: '著作権侵害', description: '著作権を侵害する内容' },
  { value: 'other', label: 'その他', description: '上記に該当しない理由' }
]

export function ReportModal({ isOpen, onClose, onSubmit, type, itemTitle }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReason) {
      setError('通報理由を選択してください')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(selectedReason, description)
      // 成功したらフォームをリセット
      setSelectedReason('')
      setDescription('')
      onClose()
    } catch (err: any) {
      setError(err.message || '通報の送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('')
      setDescription('')
      setError('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">通報する</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* 説明 */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">通報について</p>
                <p>
                  {type === 'post' ? 'この投稿' : 'このコメント'}を通報します。
                  管理者が内容を確認し、適切な対応を行います。
                </p>
              </div>
            </div>
          </div>

          {/* 通報対象 */}
          {itemTitle && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">通報対象</p>
              <p className="text-gray-900 font-medium line-clamp-2">{itemTitle}</p>
            </div>
          )}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 通報理由 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                通報理由 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedReason === reason.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1 mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{reason.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{reason.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 詳細説明 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                詳細説明（任意）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="通報の詳細や追加情報があれば記入してください"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* ボタン */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedReason}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? '送信中...' : '通報する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

