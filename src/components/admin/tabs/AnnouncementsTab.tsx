'use client'

import { Plus, Edit, Trash } from 'lucide-react'
import type { GlobalAnnouncement, Quest } from '@/lib/supabase'
import { createGlobalAnnouncement, updateGlobalAnnouncement, deleteGlobalAnnouncement, createGlobalQuest } from '@/lib/admin'
import { useState } from 'react'
import Modal from '../shared/Modal'
import StatusBadge from '../shared/StatusBadge'

interface AnnouncementsTabProps {
  announcements: GlobalAnnouncement[]
  globalQuests: Quest[]
  currentUserId: string | undefined
  onReload: () => void
}

export default function AnnouncementsTab({ announcements, globalQuests, currentUserId, onReload }: AnnouncementsTabProps) {
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<GlobalAnnouncement | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' })
  const [questForm, setQuestForm] = useState({ title: '', description: '', reward_amount: 0, deadline: '' })

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      alert('タイトルと内容を入力してください')
      return
    }
    if (!currentUserId) {
      alert('ユーザー情報が取得できません')
      return
    }

    if (editingAnnouncement) {
      const { error } = await updateGlobalAnnouncement(editingAnnouncement.id, announcementForm.title, announcementForm.content)
      if (error) {
        alert(`エラー: ${error}`)
      } else {
        alert('お知らせを更新しました')
        closeAnnouncementForm()
        onReload()
      }
    } else {
      const { error } = await createGlobalAnnouncement(announcementForm.title, announcementForm.content, currentUserId)
      if (error) {
        alert(`エラー: ${error}`)
      } else {
        alert('お知らせを作成しました。全ユーザーに通知が送信されます。')
        closeAnnouncementForm()
        onReload()
      }
    }
  }

  const handleSaveQuest = async () => {
    if (!questForm.title || questForm.reward_amount < 0) {
      alert('タイトルと報酬を正しく入力してください')
      return
    }
    if (!currentUserId) {
      alert('ユーザー情報が取得できません')
      return
    }

    let deadlineISO: string | null = null
    if (questForm.deadline) {
      deadlineISO = new Date(questForm.deadline).toISOString()
    }

    const result = await createGlobalQuest(questForm.title, questForm.description, questForm.reward_amount, deadlineISO, currentUserId)
    if (result.error) {
      alert(`エラー: ${result.error}`)
    } else {
      alert('クエストを作成しました。全ユーザーに通知が送信されます。')
      setShowQuestForm(false)
      setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' })
      onReload()
    }
  }

  const closeAnnouncementForm = () => {
    setShowAnnouncementForm(false)
    setEditingAnnouncement(null)
    setAnnouncementForm({ title: '', content: '' })
  }

  return (
    <>
      <div className="space-y-6">
        {/* Announcements section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">全員向けお知らせ</h2>
            <button
              onClick={() => {
                setShowAnnouncementForm(true)
                setEditingAnnouncement(null)
                setAnnouncementForm({ title: '', content: '' })
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              お知らせを作成
            </button>
          </div>

          {announcements.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">お知らせはありません</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                      <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap line-clamp-3">{announcement.content}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(announcement.created_at).toLocaleString('ja-JP')}
                        {announcement.creator && ` by ${announcement.creator.name}`}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingAnnouncement(announcement)
                          setAnnouncementForm({ title: announcement.title, content: announcement.content })
                          setShowAnnouncementForm(true)
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        編集
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('このお知らせを削除しますか？')) {
                            const { error } = await deleteGlobalAnnouncement(announcement.id)
                            if (error) {
                              alert(`エラー: ${error}`)
                            } else {
                              alert('お知らせを削除しました')
                              onReload()
                            }
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <Trash className="h-3 w-3" />
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quests section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">全員向けクエスト</h2>
            <button
              onClick={() => {
                setShowQuestForm(true)
                setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' })
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              クエストを作成
            </button>
          </div>

          {globalQuests.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">クエストはありません</p>
          ) : (
            <div className="space-y-3">
              {globalQuests.map((quest) => (
                <div key={quest.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{quest.title}</h3>
                        <StatusBadge status={quest.status} />
                      </div>
                      {quest.description && (
                        <div className="text-sm text-gray-600 mb-2">{quest.description}</div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>報酬: {quest.reward_amount}ポイント</span>
                        {quest.deadline && <span>締切: {new Date(quest.deadline).toLocaleString('ja-JP')}</span>}
                        <span>{new Date(quest.created_at).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcement create/edit modal */}
      <Modal
        isOpen={showAnnouncementForm}
        onClose={closeAnnouncementForm}
        title={editingAnnouncement ? 'お知らせを編集' : 'お知らせを作成'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">タイトル *</label>
            <input
              type="text"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">内容（Markdown形式） *</label>
            <textarea
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              rows={15}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="# 見出し1&#10;## 見出し2&#10;&#10;**太字**&#10;&#10;- リスト項目"
            />
            <p className="text-xs text-gray-400 mt-1">Markdown形式で記入できます。</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveAnnouncement}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
          >
            {editingAnnouncement ? '更新' : '作成'}
          </button>
          <button
            onClick={closeAnnouncementForm}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            キャンセル
          </button>
        </div>
      </Modal>

      {/* Quest create modal */}
      <Modal
        isOpen={showQuestForm}
        onClose={() => { setShowQuestForm(false); setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' }) }}
        title="全員向けクエストを作成"
      >
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">タイトル *</label>
            <input
              type="text"
              value={questForm.title}
              onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">説明</label>
            <textarea
              value={questForm.description}
              onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="クエストの説明を入力してください"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">報酬（ポイント） *</label>
              <input
                type="number"
                value={questForm.reward_amount}
                onChange={(e) => setQuestForm({ ...questForm, reward_amount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">締切日時</label>
              <input
                type="datetime-local"
                value={questForm.deadline}
                onChange={(e) => setQuestForm({ ...questForm, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveQuest}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
          >
            作成
          </button>
          <button
            onClick={() => { setShowQuestForm(false); setQuestForm({ title: '', description: '', reward_amount: 0, deadline: '' }) }}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            キャンセル
          </button>
        </div>
      </Modal>
    </>
  )
}
