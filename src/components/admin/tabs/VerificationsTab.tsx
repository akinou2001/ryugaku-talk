'use client'

import { CheckCircle, XCircle, FileCheck } from 'lucide-react'
import type { OrganizationVerificationRequest } from '@/lib/supabase'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'
import StatusBadge from '../shared/StatusBadge'

interface VerificationsTabProps {
  requests: OrganizationVerificationRequest[]
  selectedRequest: OrganizationVerificationRequest | null
  onSelectRequest: (r: OrganizationVerificationRequest | null) => void
  reviewNotes: string
  onReviewNotesChange: (v: string) => void
  processing: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export default function VerificationsTab({
  requests,
  selectedRequest,
  onSelectRequest,
  reviewNotes,
  onReviewNotesChange,
  processing,
  onApprove,
  onReject,
}: VerificationsTabProps) {
  if (requests.length === 0) {
    return <EmptyState icon={FileCheck} message="認証待ちの申請はありません" />
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-900">{request.organization_name}</h3>
                  <StatusBadge
                    status={request.account_type === 'educational' ? 'verified' : request.account_type === 'company' ? 'active' : 'pending'}
                    label={request.account_type === 'educational' ? '教育機関' : request.account_type === 'company' ? '企業' : '政府機関'}
                  />
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-700">申請者:</span> {request.profiles?.name} ({request.profiles?.email})</p>
                  <p><span className="font-medium text-gray-700">担当者:</span> {request.contact_person_name} ({request.contact_person_email})</p>
                  {request.organization_url && (
                    <p><span className="font-medium text-gray-700">URL:</span> <a href={request.organization_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{request.organization_url}</a></p>
                  )}
                  {request.request_reason && (
                    <p><span className="font-medium text-gray-700">申請理由:</span> {request.request_reason}</p>
                  )}
                  <p><span className="font-medium text-gray-700">申請日:</span> {new Date(request.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
              <button
                onClick={() => onSelectRequest(request)}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                詳細
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => { onSelectRequest(null); onReviewNotesChange('') }}
        title="認証申請の詳細"
      >
        {selectedRequest && (
          <div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">組織名</label>
                <p className="text-gray-900">{selectedRequest.organization_name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">申請者</label>
                <p className="text-gray-900">{selectedRequest.profiles?.name} ({selectedRequest.profiles?.email})</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">担当者</label>
                <p className="text-gray-900">{selectedRequest.contact_person_name} ({selectedRequest.contact_person_email})</p>
              </div>
              {selectedRequest.request_reason && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">申請理由</label>
                  <p className="text-gray-900">{selectedRequest.request_reason}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 mb-2">審査メモ</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => onReviewNotesChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="審査メモを入力してください（任意）"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onApprove(selectedRequest.id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                承認
              </button>
              <button
                onClick={() => onReject(selectedRequest.id)}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <XCircle className="h-4 w-4" />
                拒否
              </button>
              <button
                onClick={() => { onSelectRequest(null); onReviewNotesChange('') }}
                className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
