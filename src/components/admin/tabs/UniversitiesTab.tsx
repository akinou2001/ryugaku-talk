'use client'

import { Search, Plus, Edit, Trash, GraduationCap } from 'lucide-react'
import { searchUniversities, getContinents, getCountryCodes, createUniversity, updateUniversity, deleteUniversity, getUniversityAliases, createAlias, deleteAlias, type University, type Continent, type UniversityAlias } from '@/lib/universities'
import { useState, useEffect } from 'react'
import EmptyState from '../shared/EmptyState'
import Modal from '../shared/Modal'

interface UniversitiesTabProps {
  onReload: () => void
}

export default function UniversitiesTab({ onReload }: UniversitiesTabProps) {
  const [universities, setUniversities] = useState<University[]>([])
  const [continents, setContinents] = useState<Continent[]>([])
  const [countryCodes, setCountryCodes] = useState<string[]>([])
  const [filters, setFilters] = useState({
    query: '',
    countryCode: '',
    continentId: '',
  })
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [selectedUniversityAliases, setSelectedUniversityAliases] = useState<UniversityAlias[]>([])
  const [isEditingUniversity, setIsEditingUniversity] = useState(false)
  const [isAddingUniversity, setIsAddingUniversity] = useState(false)
  const [newAlias, setNewAlias] = useState({ alias: '', alias_type: 'other' as 'abbreviation' | 'variant' | 'old_name' | 'other' })
  const [universityForm, setUniversityForm] = useState({
    name_en: '',
    name_ja: '',
    country_code: '',
    continent_id: null as number | null,
    city: '',
    latitude: '',
    longitude: '',
    website: '',
    tags: [] as string[],
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    const [continentsRes, countryCodesRes] = await Promise.all([
      getContinents(),
      getCountryCodes(),
    ])
    if (continentsRes.data) setContinents(continentsRes.data)
    if (countryCodesRes.data) setCountryCodes(countryCodesRes.data.map((c: any) => c.country_code))
    await loadUniversities()
  }

  const loadUniversities = async () => {
    const { data, error } = await searchUniversities({
      query: filters.query || undefined,
      countryCode: filters.countryCode || undefined,
      continentId: filters.continentId ? parseInt(filters.continentId) : undefined,
      limit: 100,
    })
    if (error) {
      console.error('Error loading universities:', error)
      alert(`大学データの取得に失敗しました: ${(error as any).message || error}`)
    }
    setUniversities(data || [])
  }

  const handleSave = async () => {
    if (!universityForm.name_en || !universityForm.country_code) {
      alert('英語名と国コードは必須です')
      return
    }
    const universityData: any = {
      name_en: universityForm.name_en,
      name_ja: universityForm.name_ja || null,
      country_code: universityForm.country_code,
      continent_id: universityForm.continent_id,
      city: universityForm.city || null,
      latitude: universityForm.latitude ? parseFloat(universityForm.latitude) : null,
      longitude: universityForm.longitude ? parseFloat(universityForm.longitude) : null,
      website: universityForm.website || null,
      tags: universityForm.tags,
    }

    if (isAddingUniversity) {
      const { error } = await createUniversity(universityData)
      if (error) {
        alert(`エラー: ${(error as any).message || error}`)
      } else {
        alert('大学を追加しました')
        closeModal()
        loadUniversities()
      }
    } else if (selectedUniversity) {
      const { error } = await updateUniversity(selectedUniversity.id, universityData)
      if (error) {
        alert(`エラー: ${(error as any).message || error}`)
      } else {
        alert('大学を更新しました')
        closeModal()
        loadUniversities()
      }
    }
  }

  const closeModal = () => {
    setIsEditingUniversity(false)
    setIsAddingUniversity(false)
    setSelectedUniversity(null)
    setSelectedUniversityAliases([])
    setNewAlias({ alias: '', alias_type: 'other' })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && loadUniversities()}
                  placeholder="大学名（日本語・英語）"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">国</label>
              <select
                value={filters.countryCode}
                onChange={(e) => setFilters({ ...filters, countryCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">すべて</option>
                {countryCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">大陸</label>
              <select
                value={filters.continentId}
                onChange={(e) => setFilters({ ...filters, continentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">すべて</option>
                {continents.map(continent => (
                  <option key={continent.id} value={continent.id.toString()}>{continent.name_ja}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={loadUniversities}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
              >
                検索
              </button>
              <button
                onClick={() => {
                  setIsAddingUniversity(true)
                  setUniversityForm({
                    name_en: '', name_ja: '', country_code: '', continent_id: null,
                    city: '', latitude: '', longitude: '', website: '', tags: [],
                  })
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                追加
              </button>
            </div>
          </div>
        </div>

        {/* University list */}
        {universities.length === 0 ? (
          <EmptyState icon={GraduationCap} message="大学が見つかりません" />
        ) : (
          <div className="space-y-3">
            {universities.map((uni) => (
              <div key={uni.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">
                        {uni.name_ja || uni.name_en}
                      </h3>
                      {uni.name_ja && (
                        <span className="text-xs text-gray-500">({uni.name_en})</span>
                      )}
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {uni.country_code}
                      </span>
                      {uni.continent && (
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                          {uni.continent.name_ja}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 text-sm text-gray-600">
                      {uni.city && <p className="text-xs">{uni.city}</p>}
                      {uni.website && (
                        <a href={uni.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">{uni.website}</a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={async () => {
                        setSelectedUniversity(uni)
                        setIsEditingUniversity(true)
                        setUniversityForm({
                          name_en: uni.name_en,
                          name_ja: uni.name_ja || '',
                          country_code: uni.country_code,
                          continent_id: uni.continent_id || null,
                          city: uni.city || '',
                          latitude: uni.latitude?.toString() || '',
                          longitude: uni.longitude?.toString() || '',
                          website: uni.website || '',
                          tags: uni.tags || [],
                        })
                        const { data: aliases } = await getUniversityAliases(uni.id)
                        setSelectedUniversityAliases(aliases || [])
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      編集
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`「${uni.name_ja || uni.name_en}」を削除しますか？この操作は取り消せません。`)) {
                          const { error } = await deleteUniversity(uni.id)
                          if (error) {
                            alert(`エラー: ${(error as any).message || error}`)
                          } else {
                            alert('大学を削除しました')
                            loadUniversities()
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

      {/* University edit/add modal */}
      <Modal
        isOpen={isEditingUniversity || isAddingUniversity}
        onClose={closeModal}
        title={isAddingUniversity ? '大学を追加' : '大学を編集'}
      >
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">英語名 *</label>
            <input
              type="text"
              value={universityForm.name_en}
              onChange={(e) => setUniversityForm({ ...universityForm, name_en: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">日本語名</label>
            <input
              type="text"
              value={universityForm.name_ja}
              onChange={(e) => setUniversityForm({ ...universityForm, name_ja: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">国コード *</label>
              <select
                value={universityForm.country_code}
                onChange={(e) => setUniversityForm({ ...universityForm, country_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">選択してください</option>
                {countryCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">大陸</label>
              <select
                value={universityForm.continent_id?.toString() || ''}
                onChange={(e) => setUniversityForm({ ...universityForm, continent_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">選択してください</option>
                {continents.map(continent => (
                  <option key={continent.id} value={continent.id.toString()}>{continent.name_ja}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">都市</label>
            <input
              type="text"
              value={universityForm.city}
              onChange={(e) => setUniversityForm({ ...universityForm, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">緯度</label>
              <input
                type="number"
                step="any"
                value={universityForm.latitude}
                onChange={(e) => setUniversityForm({ ...universityForm, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">経度</label>
              <input
                type="number"
                step="any"
                value={universityForm.longitude}
                onChange={(e) => setUniversityForm({ ...universityForm, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">公式サイトURL</label>
            <input
              type="url"
              value={universityForm.website}
              onChange={(e) => setUniversityForm({ ...universityForm, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Aliases (edit only) */}
        {isEditingUniversity && selectedUniversity && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">表記ゆれ・略称</h3>
            <div className="space-y-2 mb-3">
              {selectedUniversityAliases.map((alias) => (
                <div key={alias.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{alias.alias}</span>
                    <span className="ml-2 text-xs text-gray-500">({alias.alias_type})</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`「${alias.alias}」を削除しますか？`)) {
                        const { error } = await deleteAlias(alias.id)
                        if (error) {
                          alert(`エラー: ${(error as any).message || error}`)
                        } else {
                          const { data: aliases } = await getUniversityAliases(selectedUniversity.id)
                          setSelectedUniversityAliases(aliases || [])
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAlias.alias}
                onChange={(e) => setNewAlias({ ...newAlias, alias: e.target.value })}
                placeholder="エイリアスを入力"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={newAlias.alias_type}
                onChange={(e) => setNewAlias({ ...newAlias, alias_type: e.target.value as any })}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="abbreviation">略称</option>
                <option value="variant">表記ゆれ</option>
                <option value="old_name">旧名称</option>
                <option value="other">その他</option>
              </select>
              <button
                onClick={async () => {
                  if (!newAlias.alias.trim()) {
                    alert('エイリアスを入力してください')
                    return
                  }
                  const { error } = await createAlias({
                    university_id: selectedUniversity.id,
                    alias: newAlias.alias.trim(),
                    alias_type: newAlias.alias_type,
                  })
                  if (error) {
                    alert(`エラー: ${(error as any).message || error}`)
                  } else {
                    setNewAlias({ alias: '', alias_type: 'other' })
                    const { data: aliases } = await getUniversityAliases(selectedUniversity.id)
                    setSelectedUniversityAliases(aliases || [])
                  }
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
          >
            {isAddingUniversity ? '追加' : '更新'}
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            キャンセル
          </button>
        </div>
      </Modal>
    </>
  )
}
