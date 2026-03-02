'use client'

import { useEffect, useRef, useState, useId } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import type { Post } from '@/lib/supabase'
import { defaultMapCenter, defaultZoom } from '@/lib/countryCoordinates'
import { useUniversityCoordinates } from '@/hooks/useUniversityCoordinates'
import {
  type MapComponentProps,
  type UserPostData,
  getCategoryStyle,
  isWithin24Hours,
} from '@/lib/mapUtils'
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

// カスタムマーカーアイコンを作成（CSSアニメーションは外部定義に移動）
function createMarkerIcon(post: Post, isSelected: boolean, userData?: UserPostData) {
  const postCategory = post.category || 'question'
  const isDiaryRecent = postCategory === 'diary' && isWithin24Hours(post.created_at)
  const isQuestionUnresolved = postCategory === 'question' && !post.is_resolved
  const isChat = postCategory === 'chat'

  const style = getCategoryStyle(postCategory, post.urgency_level, post.is_resolved)
  const size = isSelected ? 40 : 32
  const scale = isSelected ? 1.2 : 1

  const avatarUrl = post.author?.icon_url
  const authorName = post.author?.name || '匿名'
  const initials = authorName.charAt(0).toUpperCase()

  const getBubbleText = () => {
    if (isChat) return post.content.substring(0, 10) + (post.content.length > 10 ? '...' : '')
    if (postCategory === 'question' || postCategory === 'diary') {
      return (post.title?.substring(0, 10) + (post.title && post.title.length > 10 ? '...' : '')) || ''
    }
    return ''
  }
  const bubbleText = getBubbleText()

  const ringAnimClass = isQuestionUnresolved ? 'marker-pulse' : isDiaryRecent ? 'marker-sparkle' : ''
  const glowAnimClass = isDiaryRecent ? 'marker-glow' : ''

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
      <div class="${ringAnimClass}" style="
        position: absolute;
        width: ${size * 1.8}px;
        height: ${size * 1.8}px;
        border-radius: 50%;
        border: ${style.ringWidth}px solid ${style.ringColor};
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      "></div>
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
      <div class="${glowAnimClass}" style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        overflow: hidden;
        background: ${style.bgColor};
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        z-index: 1;
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
          font-size: ${size * 0.4}px;
          background: ${style.bgColor};
        ">
          ${initials}
        </div>
      </div>
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
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [size * 1.8, size * 1.8],
    iconAnchor: [size * 0.9, size * 0.9],
  })
}

export function MapView({ posts, userPostData, onMarkerClick, selectedPostId }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const isFirstLoadRef = useRef(true)
  const [showHelp, setShowHelp] = useState(false)
  const [helpDismissed, setHelpDismissed] = useState(false)
  const mapIdRef = useRef(`map-${Math.random().toString(36).slice(2, 9)}`)

  const { postCoordinates } = useUniversityCoordinates(posts)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    // 地図の初期化
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([defaultMapCenter.lat, defaultMapCenter.lng], defaultZoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    const map = mapRef.current

    // 既存のクラスタグループを削除
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current)
    }

    // マーカークラスタグループを作成
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const childCount = cluster.getChildCount()
        // クラスタ内のカテゴリ分布を計算
        const markers = cluster.getAllChildMarkers()
        const cats = { question: 0, diary: 0, chat: 0 }
        markers.forEach((m: any) => {
          const cat = m.options._postCategory as string
          if (cat in cats) cats[cat as keyof typeof cats]++
        })
        const dominant = Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0]
        const style = getCategoryStyle(dominant)

        return L.divIcon({
          html: `<div style="
            width: 40px; height: 40px;
            border-radius: 50%;
            background: ${style.bgColor};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          ">${childCount}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
          iconAnchor: L.point(20, 20),
        })
      },
    })
    clusterGroupRef.current = clusterGroup

    // マーカーを作成
    postCoordinates.forEach(({ post, coords, locationLabel }) => {
      const userData = userPostData?.find(data => data.displayPost.id === post.id)
      const displayPost = userData ? userData.displayPost : post
      const isSelected = selectedPostId === displayPost.id

      const icon = createMarkerIcon(displayPost, isSelected, userData)
      const marker = L.marker([coords.lat, coords.lng], {
        icon,
        _postCategory: displayPost.category || 'question',
      } as any)

      // ポップアップ（クリックで表示）
      const style = getCategoryStyle(displayPost.category, displayPost.urgency_level, displayPost.is_resolved)
      const avatarUrl = displayPost.author?.icon_url
      const authorName = displayPost.author?.name || '匿名'
      const initials = authorName.charAt(0).toUpperCase()

      const popupContent = `
        <div style="min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="
              width: 32px; height: 32px;
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
                <img src="${avatarUrl}" alt="${authorName}"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
              ` : ''}
              <div style="
                width: 100%; height: 100%;
                display: ${avatarUrl ? 'none' : 'flex'};
                align-items: center; justify-content: center;
                color: white; font-weight: bold; font-size: 14px;
              ">${initials}</div>
            </div>
            <div style="flex: 1;">
              <h3 style="font-weight: bold; margin: 0; font-size: 14px; line-height: 1.2;">
                ${displayPost.category === 'chat' ? 'つぶやき' : displayPost.title || 'タイトルなし'}
              </h3>
              <div style="font-size: 11px; color: #666; margin-top: 2px;">${authorName}</div>
            </div>
          </div>
          ${displayPost.category === 'question' && displayPost.urgency_level && !displayPost.is_resolved ? `
            <div style="display: inline-block; padding: 2px 8px; border-radius: 12px;
              background: ${style.ringColor}20; color: ${style.ringColor};
              font-size: 11px; font-weight: 600; margin-bottom: 8px;">
              ${displayPost.urgency_level === 'urgent' ? '緊急' : '通常'}
            </div>
          ` : ''}
          <p style="font-size: 12px; color: #666; margin: 8px 0; line-height: 1.4;">
            ${displayPost.content.substring(0, 100)}${displayPost.content.length > 100 ? '...' : ''}
          </p>
          <div style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
            <div style="margin-bottom: 6px;">📍 ${locationLabel || '不明'}</div>
            <a href="/posts/${displayPost.id}"
              style="display: inline-block; padding: 6px 12px;
                background: ${style.bgColor}; color: white; border-radius: 6px;
                text-decoration: none; font-size: 12px; font-weight: 600; cursor: pointer;"
              onclick="event.preventDefault(); event.stopPropagation(); window.location.href='/posts/${displayPost.id}';"
            >詳細を見る →</a>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, { className: 'custom-popup', maxWidth: 250 })

      // クリック → ポップアップ表示（Leafletデフォルト動作）
      // ホバー → アイコン拡大のみ（ポップアップは開かない）
      marker.on('mouseover', () => {
        marker.setIcon(createMarkerIcon(displayPost, true, userData))
      })
      marker.on('mouseout', () => {
        if (!marker.isPopupOpen()) {
          marker.setIcon(createMarkerIcon(displayPost, isSelected, userData))
        }
      })
      marker.on('popupclose', () => {
        marker.setIcon(createMarkerIcon(displayPost, isSelected, userData))
      })

      clusterGroup.addLayer(marker)
    })

    map.addLayer(clusterGroup)

    // 初回のみマーカーに合わせてビューを調整
    if (isFirstLoadRef.current && postCoordinates.length > 0) {
      const bounds = clusterGroup.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 })
      }
      isFirstLoadRef.current = false
    }

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current)
        clusterGroupRef.current = null
      }
    }
  }, [postCoordinates, userPostData, onMarkerClick, selectedPostId])

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[800px] rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
      <div
        ref={mapContainerRef}
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
        <div className="absolute top-16 right-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-5 max-w-xs border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              操作方法
            </h3>
            <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                <div className="text-xs text-gray-600">ポップアップ表示 → 詳細へ</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs font-bold">H</span>
              </div>
              <div>
                <div className="font-semibold">ホバー</div>
                <div className="text-xs text-gray-600">ピンにマウスを合わせるとハイライト</div>
              </div>
            </div>
          </div>
          {!helpDismissed && (
            <button
              onClick={() => { setHelpDismissed(true); setShowHelp(false) }}
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
        .custom-cluster-icon {
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
        .marker-cluster-small,
        .marker-cluster-medium,
        .marker-cluster-large {
          background: transparent !important;
        }
        .marker-cluster-small div,
        .marker-cluster-medium div,
        .marker-cluster-large div {
          background: transparent !important;
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes sparkle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
          50% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
        }
        @keyframes sparkle-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        .marker-pulse { animation: pulse-ring 2s infinite; }
        .marker-sparkle { animation: sparkle 2s infinite; }
        .marker-glow { animation: sparkle-glow 2s infinite; }
        .custom-marker-wrapper:hover {
          transform: scale(1.15) !important;
        }
      `}</style>
    </div>
  )
}
