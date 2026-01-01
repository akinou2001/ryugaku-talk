'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Post } from '@/lib/supabase'
import { getCountryCoordinates, defaultMapCenter, defaultZoom } from '@/lib/countryCoordinates'

// Leafletのデフォルトアイコンの問題を修正
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface MapViewProps {
  posts: Post[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

// 投稿種別に応じた色とアイコンを取得
function getCategoryStyle(category: string, urgencyLevel?: string) {
  const baseStyles = {
    question: {
      bgColor: '#3B82F6', // 青
      borderColor: '#2563EB',
      icon: '❓',
      shape: 'circle' as const,
    },
    diary: {
      bgColor: '#10B981', // 緑
      borderColor: '#059669',
      icon: '📝',
      shape: 'square' as const,
    },
    chat: {
      bgColor: '#8B5CF6', // 紫
      borderColor: '#7C3AED',
      icon: '💬',
      shape: 'diamond' as const,
    },
  }

  const style = baseStyles[category as keyof typeof baseStyles] || baseStyles.question

  // 緊急度に応じたリングの色
  let ringColor = style.borderColor
  let ringWidth = 2
  if (category === 'question' && urgencyLevel) {
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

// カスタムマーカーアイコンを作成
function createMarkerIcon(post: Post, isSelected: boolean) {
  const style = getCategoryStyle(post.category, post.urgency_level)
  const size = isSelected ? 40 : 32
  const scale = isSelected ? 1.2 : 1

  // 投稿者のアイコン画像URL（デフォルトアイコンは使用しない）
  const avatarUrl = post.author?.icon_url
  const authorName = post.author?.name || '匿名'
  
  // デフォルトアイコンの背景色（名前の最初の文字から生成）
  const defaultBgColor = style.bgColor
  const initials = authorName.charAt(0).toUpperCase()

  const iconHtml = `
    <div class="custom-marker-wrapper" style="
      position: relative;
      width: ${size * 1.6}px;
      height: ${size * 1.6}px;
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
        width: ${size * 1.6}px;
        height: ${size * 1.6}px;
        border-radius: 50%;
        border: ${style.ringWidth}px solid ${style.ringColor};
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        animation: ${isSelected ? 'pulse 2s infinite' : 'none'};
      "></div>
      
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
        font-size: ${size * 0.2}px;
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
    </div>
    <style>
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
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
    iconSize: [size * 1.6, size * 1.6],
    iconAnchor: [size * 0.8, size * 0.8],
  })
}

export function MapView({ posts, onMarkerClick, selectedPostId }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

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

    // 投稿を国ごとにグループ化（位置をずらすため）
    const postsByCountry = posts.reduce((acc, post) => {
      const country = post.study_abroad_destination || '不明'
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

        const icon = createMarkerIcon(post, isSelected)
        const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map)

        // ポップアップを作成
        const style = getCategoryStyle(post.category, post.urgency_level)
        const avatarUrl = post.author?.icon_url
        const authorName = post.author?.name || '匿名'
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
                  ${post.category === 'chat' ? 'つぶやき' : post.title}
                </h3>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">
                  ${authorName}
                </div>
              </div>
            </div>
            ${post.category === 'question' && post.urgency_level ? `
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
                ${post.urgency_level === 'urgent' ? '緊急' : post.urgency_level === 'high' ? '高' : post.urgency_level === 'normal' ? '通常' : '低'}
              </div>
            ` : ''}
            <p style="font-size: 12px; color: #666; margin: 8px 0; line-height: 1.4;">
              ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}
            </p>
            <div style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
              <div>📍 ${country}</div>
            </div>
          </div>
        `

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 250,
        })

        // マーカークリック時の処理
        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(post)
          }
        })

        // ホバー時の効果
        marker.on('mouseover', () => {
          marker.setIcon(createMarkerIcon(post, true))
        })

        marker.on('mouseout', () => {
          marker.setIcon(createMarkerIcon(post, isSelected))
        })

        markersRef.current.push(marker)
      })
    })

    // 地図のビューを調整（マーカーがすべて表示されるように）
    if (markersRef.current.length > 0) {
      const bounds = L.latLngBounds(
        markersRef.current.map(m => m.getLatLng())
      )
      map.fitBounds(bounds, { padding: [80, 80] })
    }

    return () => {
      // クリーンアップ
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [posts, onMarkerClick, selectedPostId])

  return (
    <>
      <div
        id="map-container"
        style={{
          width: '100%',
          height: '600px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      />
      <style jsx global>{`
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </>
  )
}

