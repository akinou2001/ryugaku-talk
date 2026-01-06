'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Post, User } from '@/lib/supabase'
import { getCountryCoordinates, defaultMapCenter, defaultZoom } from '@/lib/countryCoordinates'
import { HelpCircle, X, Move, ZoomIn, MousePointer2, Info } from 'lucide-react'

// Leafletのデフォルトアイコンの問題を修正
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface UserPostData {
  user: User
  posts: Post[]
  displayPost: Post
  displayType: 'question' | 'diary' | 'chat' | 'normal'
}

interface MapViewProps {
  posts: Post[]
  userPostData?: UserPostData[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

// 投稿種別に応じた色とアイコンを取得
function getCategoryStyle(category: string, urgencyLevel?: string, isResolved?: boolean) {
  const baseStyles = {
    question: {
      bgColor: '#3B82F6', // 青
      borderColor: '#2563EB',
      icon: '?', // 白色のテキストに変更
      shape: 'circle' as const,
    },
    diary: {
      bgColor: '#10B981', // 緑
      borderColor: '#059669',
      icon: 'D', // 白色のテキストに変更
      shape: 'square' as const,
    },
    chat: {
      bgColor: '#8B5CF6', // 紫
      borderColor: '#7C3AED',
      icon: 'C', // 白色のテキストに変更
      shape: 'diamond' as const,
    },
  }

  const style = baseStyles[category as keyof typeof baseStyles] || baseStyles.question

  // 緊急度に応じたリングの色（質問のみ、未解決の場合）
  let ringColor = style.borderColor
  let ringWidth = 2
  if (category === 'question' && !isResolved && urgencyLevel) {
    switch (urgencyLevel) {
      case 'urgent':
        ringColor = '#EF4444' // 赤
        ringWidth = 4
        break
      case 'high':
        ringColor = '#F59E0B' // オレンジ
        ringWidth = 3
        break
      case 'normal':
        ringColor = '#3B82F6' // 青
        ringWidth = 2
        break
      case 'low':
        ringColor = '#9CA3AF' // グレー
        ringWidth = 2
        break
    }
  }

  return { ...style, ringColor, ringWidth }
}

// 同じ国に複数の投稿がある場合、位置を少しずつずらす
function getOffsetCoordinates(baseCoords: { lat: number; lng: number }, index: number, total: number) {
  if (total === 1) return baseCoords
  
  // 円形に配置するための角度を計算
  const angle = (index / total) * Math.PI * 2
  const radius = 0.1 // 約11km
  const latOffset = radius * Math.cos(angle) / 111 // 1度 ≈ 111km
  const lngOffset = radius * Math.sin(angle) / (111 * Math.cos(baseCoords.lat * Math.PI / 180))

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
  }
}

// 24時間以内かどうかを判定
function isWithin24Hours(createdAt: string): boolean {
  const now = new Date()
  const postDate = new Date(createdAt)
  const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
  return hoursSincePost <= 24
}

// カスタムマーカーアイコンを作成
function createMarkerIcon(
  post: Post, 
  isSelected: boolean,
  userPostData?: UserPostData
) {
  const now = new Date()
  // postパラメータには既にdisplayPostが渡されているので、そのcategoryを使用
  const postCategory = post.category || 'question' // フォールバック
  
  // デバッグログ（すべての投稿）
  console.log('createMarkerIcon:', {
    postId: post.id,
    category: post.category,
    postCategory,
    hasUserData: !!userPostData,
    userDataDisplayType: userPostData?.displayType
  })
  
  const isDiaryRecent = postCategory === 'diary' && isWithin24Hours(post.created_at)
  const isQuestionUnresolved = postCategory === 'question' && !post.is_resolved
  const isChat = postCategory === 'chat'
  
  const style = getCategoryStyle(postCategory, post.urgency_level, post.is_resolved)
  const size = isSelected ? 40 : 32
  const scale = isSelected ? 1.2 : 1

  // 投稿者のアイコン画像URL
  const avatarUrl = post.author?.icon_url
  const authorName = post.author?.name || '匿名'
  const defaultBgColor = style.bgColor
  const initials = authorName.charAt(0).toUpperCase()

  // 吹き出しに表示するテキストを決定
  const getBubbleText = () => {
    if (isChat) {
      return post.content.substring(0, 10) + (post.content.length > 10 ? '...' : '')
    } else if (postCategory === 'question' || postCategory === 'diary') {
      return (post.title?.substring(0, 10) + (post.title && post.title.length > 10 ? '...' : '')) || ''
    }
    return ''
  }
  const bubbleText = getBubbleText()

  const iconHtml = `
    <div class="custom-marker-wrapper" style="
      position: relative;
      width: ${size * 1.8}px;
      height: ${size * 1.8}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
      transform: scale(${scale});
    ">
      <!-- 外側のリング（投稿種別と緊急度表示） -->
      <div style="
        position: absolute;
        width: ${size * 1.8}px;
        height: ${size * 1.8}px;
        border-radius: 50%;
        border: ${style.ringWidth}px solid ${style.ringColor};
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ${isQuestionUnresolved ? 'animation: pulse-ring 2s infinite;' : ''}
        ${isDiaryRecent ? 'animation: sparkle 2s infinite;' : ''}
      "></div>
      
      <!-- キラキラエフェクト（24時間以内の日記） -->
      ${isDiaryRecent ? `
        <div style="
          position: absolute;
          width: ${size * 1.8}px;
          height: ${size * 1.8}px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
          animation: sparkle-rotate 3s linear infinite;
          pointer-events: none;
        "></div>
      ` : ''}
      
      <!-- 投稿種別の形状インジケーター（小さなバッジ） -->
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: ${size * 0.35}px;
        height: ${size * 0.35}px;
        background: ${style.bgColor};
        border-radius: ${style.shape === 'square' ? '2px' : style.shape === 'diamond' ? '2px' : '50%'};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.18}px;
        font-weight: bold;
        color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        z-index: 2;
        transform: rotate(${style.shape === 'diamond' ? '45deg' : '0deg'});
      ">
        ${style.shape === 'diamond' ? '' : style.icon}
      </div>
      
      <!-- メインアイコン（投稿者の画像） -->
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        overflow: hidden;
        background: ${defaultBgColor};
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        ${isDiaryRecent ? 'animation: sparkle-glow 2s infinite;' : ''}
      ">
        ${avatarUrl ? `
          <img 
            src="${avatarUrl}" 
            alt="${authorName}"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
        ` : ''}
        <div style="
          width: 100%;
          height: 100%;
          display: ${avatarUrl ? 'none' : 'flex'};
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size * 0.4}px;
          background: ${defaultBgColor};
        ">
          ${initials}
        </div>
      </div>
      
      <!-- 吹き出し（つぶやき・質問・日記のタイトル） -->
      ${bubbleText ? `
        <div style="
          position: absolute;
          top: ${size * 1.2}px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border: 2px solid ${style.bgColor};
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 10px;
          color: #333;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          z-index: 10;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${bubbleText}
        </div>
      ` : ''}
    </div>
    <style>
      @keyframes pulse-ring {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.15);
          opacity: 0.7;
        }
      }
      @keyframes sparkle {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(255, 215, 0, 0);
        }
      }
      @keyframes sparkle-rotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      @keyframes sparkle-glow {
        0%, 100% {
          filter: brightness(1);
        }
        50% {
          filter: brightness(1.3);
        }
      }
      .custom-marker-wrapper:hover {
        transform: scale(1.15) !important;
      }
    </style>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [size * 1.8, size * 1.8],
    iconAnchor: [size * 0.9, size * 0.9],
  })
}

export function MapView({ posts, userPostData, onMarkerClick, selectedPostId }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [helpDismissed, setHelpDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 地図の初期化
    if (!mapRef.current) {
      mapRef.current = L.map('map-container', {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([defaultMapCenter.lat, defaultMapCenter.lng], defaultZoom)

      // モダンなタイルレイヤー（CartoDB Positron）
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    const map = mapRef.current

    // 既存のマーカーを削除
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // 投稿を国ごとにグループ化
    const postsByCountry = posts.reduce((acc, post) => {
      const country = post.author?.study_abroad_destination || '不明'
      if (!acc[country]) {
        acc[country] = []
      }
      acc[country].push(post)
      return acc
    }, {} as Record<string, Post[]>)

    // 各投稿にマーカーを配置
    Object.entries(postsByCountry).forEach(([country, countryPosts]) => {
      const baseCoords = getCountryCoordinates(country)
      if (!baseCoords) return

      countryPosts.forEach((post, index) => {
        const coords = getOffsetCoordinates(baseCoords, index, countryPosts.length)
        const isSelected = selectedPostId === post.id
        
        // ユーザーデータを取得
        const userData = userPostData?.find(data => data.displayPost.id === post.id)
        
        // userPostDataがある場合はdisplayPostを使用（正しいカテゴリを反映）
        const displayPost = userData ? userData.displayPost : post
        
        // デバッグログ
        if (displayPost.category === 'chat') {
          console.log('つぶやきマーカー作成:', {
            postId: displayPost.id,
            category: displayPost.category,
            displayType: userData?.displayType,
            hasUserData: !!userData
          })
        }

        const icon = createMarkerIcon(displayPost, isSelected, userData)
        const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map)

        // ポップアップを作成（displayPostを使用）
        const style = getCategoryStyle(displayPost.category, displayPost.urgency_level, displayPost.is_resolved)
        const avatarUrl = displayPost.author?.icon_url
        const authorName = displayPost.author?.name || '匿名'
        const initials = authorName.charAt(0).toUpperCase()
        
        const popupContent = `
          <div style="min-width: 200px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid ${style.bgColor};
                overflow: hidden;
                background: ${style.bgColor};
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                ${avatarUrl ? `
                  <img 
                    src="${avatarUrl}" 
                    alt="${authorName}"
                    style="width: 100%; height: 100%; object-fit: cover;"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  />
                ` : ''}
                <div style="
                  width: 100%;
                  height: 100%;
                  display: ${avatarUrl ? 'none' : 'flex'};
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 14px;
                ">
                  ${initials}
                </div>
              </div>
              <div style="flex: 1;">
                <h3 style="font-weight: bold; margin: 0; font-size: 14px; line-height: 1.2;">
                  ${displayPost.category === 'chat' ? 'つぶやき' : displayPost.title || 'タイトルなし'}
                </h3>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">
                  ${authorName}
                </div>
              </div>
            </div>
            ${displayPost.category === 'question' && displayPost.urgency_level && !displayPost.is_resolved ? `
              <div style="
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                background: ${style.ringColor}20;
                color: ${style.ringColor};
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 8px;
              ">
                ${displayPost.urgency_level === 'urgent' ? '緊急' : displayPost.urgency_level === 'high' ? '高' : displayPost.urgency_level === 'normal' ? '通常' : '低'}
              </div>
            ` : ''}
            <p style="font-size: 12px; color: #666; margin: 8px 0; line-height: 1.4;">
              ${displayPost.content.substring(0, 100)}${displayPost.content.length > 100 ? '...' : ''}
            </p>
            <div style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
              <div>📍 ${country}</div>
              <a 
                href="/posts/${displayPost.id}" 
                style="
                  display: inline-block;
                  margin-top: 8px;
                  padding: 6px 12px;
                  background: ${style.bgColor};
                  color: white;
                  border-radius: 6px;
                  text-decoration: none;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                "
                onclick="
                  event.preventDefault();
                  event.stopPropagation();
                  window.location.href = '/posts/${displayPost.id}';
                "
              >
                詳細を見る →
              </a>
            </div>
          </div>
        `

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 250,
        })

        // マーカークリック時の処理（displayPostを使用）- 直接遷移
        marker.on('click', (e) => {
          console.log('マーカークリックイベント:', displayPost.id)
          // クリックイベントで直接遷移
          if (onMarkerClick) {
            console.log('onMarkerClick呼び出し:', displayPost.id)
            onMarkerClick(displayPost)
          }
        })
        
        // マーカーホバー時にポップアップを表示
        marker.on('mouseover', () => {
          marker.openPopup()
          // アイコンを大きく表示
          marker.setIcon(createMarkerIcon(displayPost, true, userData))
        })
        
        marker.on('mouseout', () => {
          marker.closePopup()
          // アイコンを元のサイズに戻す
          marker.setIcon(createMarkerIcon(displayPost, isSelected, userData))
        })

        markersRef.current.push(marker)
      })
    })

    // 地図のビューは常に世界全体を表示（マーカーに合わせてズームしない）
    // ユーザーが手動でズーム・パンできるようにする
    map.setView([defaultMapCenter.lat, defaultMapCenter.lng], defaultZoom)

    return () => {
      // クリーンアップ
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [posts, userPostData, onMarkerClick, selectedPostId])

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
      <div
        id="map-container"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      />
      
      {/* ヘルプボタン */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md rounded-full p-3 shadow-lg hover:bg-white transition-all hover:scale-110 border border-gray-200"
        title="操作方法を見る"
      >
        <HelpCircle className="h-5 w-5 text-gray-700" />
      </button>

      {/* 操作説明パネル */}
      {showHelp && (
        <div className="absolute top-16 right-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-5 max-w-xs border border-gray-200 animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              操作方法
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Move className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">ドラッグ</div>
                <div className="text-xs text-gray-600">地図を移動</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ZoomIn className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">ホイール</div>
                <div className="text-xs text-gray-600">ズームイン/アウト</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MousePointer2 className="h-3 w-3 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold">ピンクリック</div>
                <div className="text-xs text-gray-600">投稿詳細へ</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs font-bold">H</span>
              </div>
              <div>
                <div className="font-semibold">ホバー</div>
                <div className="text-xs text-gray-600">ピンにマウスを合わせると詳細表示</div>
              </div>
            </div>
          </div>
          {!helpDismissed && (
            <button
              onClick={() => {
                setHelpDismissed(true)
                setShowHelp(false)
              }}
              className="mt-4 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              次回から非表示にする
            </button>
          )}
        </div>
      )}

      {/* フッター情報 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-200">
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>全{posts.length}件の投稿を表示中</span>
        </div>
      </div>

      <style jsx global>{`
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          z-index: 1 !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </div>
  )
}
