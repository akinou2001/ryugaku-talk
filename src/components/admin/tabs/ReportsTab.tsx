'use client'

import { Trash2, CheckCircle, Flag } from 'lucide-react'
import type { Report } from '@/lib/supabase'
import { updateReportStatus, deleteReportedPost, deleteReportedComment } from '@/lib/admin'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'
import StatusBadge from '../shared/StatusBadge'

interface ReportsTabProps {
  reports: Report[]
  reportStatusFilter: 'all' | 'pending' | 'reviewed' | 'resolved'
  onFilterChange: (f: 'all' | 'pending' | 'reviewed' | 'resolved') => void
  selectedReport: Report | null
  onSelectReport: (r: Report | null) => void
  processingReport: boolean
  setProcessingReport: (v: boolean) => void
  currentUserId: string | undefined
  onReload: () => void
}

export default function ReportsTab({
  reports,
  reportStatusFilter,
  onFilterChange,
  selectedReport,
  onSelectReport,
  processingReport,
  setProcessingReport,
  currentUserId,
  onReload,
}: ReportsTabProps) {
  const handleDeletePost = async (postId: string) => {
    if (confirm('この投稿を削除しますか？この操作は取り消せません。')) {
      setProcessingReport(true)
      const result = await deleteReportedPost(postId)
      setProcessingReport(false)
      if (result.success) {
        alert('投稿を削除しました')
        onReload()
      } else {
        alert(`エラー: ${result.error}`)
      }
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('このコメントを削除しますか？この操作は取り消せません。')) {
      setProcessingReport(true)
      const result = await deleteReportedComment(commentId)
      setProcessingReport(false)
      if (result.success) {
        alert('コメントを削除しました')
        onReload()
      } else {
        alert(`エラー: ${result.error}`)
      }
    }
  }

  const handleUpdateStatus = async (reportId: string, status: 'reviewed' | 'resolved') => {
    if (!currentUserId) return
    setProcessingReport(true)
    const result = await updateReportStatus(reportId, status, currentUserId)
    setProcessingReport(false)
    if (result.success) {
      alert(`ステータスを「${status === 'reviewed' ? '確認済み' : '解決済み'}」に更新しました`)
      onSelectReport(null)
      onReload()
    } else {
      alert(`エラー: ${result.error}`)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500">ステータス</label>
            <select
              value={reportStatusFilter}
              onChange={(e) => onFilterChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">すべて</option>
              <option value="pending">未対応</option>
              <option value="reviewed">確認済み</option>
              <option value="resolved">解決済み</option>
            </select>
            <button
              onClick={onReload}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
            >
              更新
            </button>
          </div>
        </div>

        {/* Reports list */}
        {reports.length === 0 ? (
          <EmptyState icon={Flag} message="通報はありません" />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusBadge status={report.status} />
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p><span className="font-medium text-gray-700">通報者:</span> <span className="text-gray-600">{report.reporter?.name || '不明'} ({report.reporter?.email || '不明'})</span></p>
                      <p><span className="font-medium text-gray-700">通報理由:</span> <span className="text-gray-600">{report.reason}</span></p>
                      {report.description && (
                        <p><span className="font-medium text-gray-700">詳細:</span> <span className="text-gray-600">{report.description}</span></p>
                      )}
                      {report.post_id && (
                        <div className="p-3 bg-gray-50 rounded-lg mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">通報対象（投稿）</p>
                          <p className="text-gray-700">{report.post?.title || '投稿が見つかりません'}</p>
                          <a href={`/posts/${report.post_id}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs mt-1 inline-block">
                            投稿を確認 &rarr;
                          </a>
                        </div>
                      )}
                      {report.comment_id && (
                        <div className="p-3 bg-gray-50 rounded-lg mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">通報対象（コメント）</p>
                          <p className="text-gray-700">{report.comment?.content?.substring(0, 100) || 'コメントが見つかりません'}...</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                    {report.status === 'pending' && (
                      <>
                        <button onClick={() => onSelectReport(report)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          詳細
                        </button>
                        {report.post_id && (
                          <button
                            onClick={() => handleDeletePost(report.post_id!)}
                            disabled={processingReport}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            投稿削除
                          </button>
                        )}
                        {report.comment_id && (
                          <button
                            onClick={() => handleDeleteComment(report.comment_id!)}
                            disabled={processingReport}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            コメント削除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report detail modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => onSelectReport(null)}
        title="通報の詳細"
      >
        {selectedReport && (
          <div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ステータス</label>
                <StatusBadge status={selectedReport.status} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">通報者</label>
                <p className="text-gray-900 text-sm">{selectedReport.reporter?.name || '不明'} ({selectedReport.reporter?.email || '不明'})</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">通報理由</label>
                <p className="text-gray-900 text-sm">{selectedReport.reason}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">詳細説明</label>
                  <p className="text-gray-900 text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              )}
              {selectedReport.post_id && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">通報対象（投稿）</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 font-semibold text-sm mb-1">{selectedReport.post?.title || '投稿が見つかりません'}</p>
                    <p className="text-gray-700 text-sm">{selectedReport.post?.content?.substring(0, 200)}...</p>
                    <a href={`/posts/${selectedReport.post_id}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs mt-2 inline-block">
                      投稿を確認 &rarr;
                    </a>
                  </div>
                </div>
              )}
              {selectedReport.comment_id && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">通報対象（コメント）</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 text-sm whitespace-pre-wrap">{selectedReport.comment?.content || 'コメントが見つかりません'}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">通報日時</label>
                <p className="text-gray-900 text-sm">{new Date(selectedReport.created_at).toLocaleString('ja-JP')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedReport.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')}
                    disabled={processingReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-50 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    確認済みにする
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                    disabled={processingReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    解決済みにする
                  </button>
                </>
              )}
              <button
                onClick={() => onSelectReport(null)}
                className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
