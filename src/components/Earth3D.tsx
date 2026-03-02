'use client'

import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Post } from '@/lib/supabase'
import { getCountryCoordinates } from '@/lib/countryCoordinates'
import { supabase } from '@/lib/supabase'
import type { University } from '@/lib/universities'
import {
  type UserPostData,
  getCategoryStyle,
  isWithin24Hours,
  getCategoryLabel,
  getCategoryColor,
  formatRelativeTime,
  getOffsetCoordinates,
} from '@/lib/mapUtils'
import { HelpCircle, BookOpen, MessageCircle, Clock, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface Earth3DProps {
  posts: Post[]
  userPostData?: UserPostData[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

// 球面座標を3D座標に変換
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

interface MarkerData {
  post: Post
  userData?: UserPostData
  position: THREE.Vector3
  category: string
  urgencyLevel?: string
  isResolved?: boolean
  isSelected: boolean
  locationLabel: string
}

// 単一マーカーピンコンポーネント（useFrame不要 - 親で一括制御）
function MarkerPin({
  marker,
  isVisible,
  isHovered,
  onHover,
  onMarkerClick,
}: {
  marker: MarkerData
  isVisible: boolean
  isHovered: boolean
  onHover: (id: string | null) => void
  onMarkerClick?: (post: Post) => void
}) {
  const style = getCategoryStyle(marker.category, marker.urgencyLevel, marker.isResolved)
  const authorName = marker.post.author?.name || '匿名'
  const avatarUrl = marker.post.author?.icon_url
  const initials = authorName.charAt(0).toUpperCase()
  const isDiaryRecent = marker.category === 'diary' && isWithin24Hours(marker.post.created_at)
  const isQuestionUnresolved = marker.category === 'question' && !marker.isResolved

  // 実ピクセルサイズで指定（distanceFactor で3D空間内のスケールを制御）
  const size = isHovered || marker.isSelected ? 40 : 32
  const wrapperSize = size * 1.5

  if (!isVisible) return null

  return (
    <group position={marker.position}>
      {/* @ts-ignore */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={8}
        transform={false}
        occlude={false}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${wrapperSize}px`,
            height: `${wrapperSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={() => onHover(marker.post.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onMarkerClick?.(marker.post)}
        >
          {/* 外側のリング */}
          <div
            className={isQuestionUnresolved ? 'marker-pulse' : isDiaryRecent ? 'marker-sparkle' : ''}
            style={{
              position: 'absolute',
              width: `${wrapperSize}px`,
              height: `${wrapperSize}px`,
              borderRadius: '50%',
              border: `${style.ringWidth}px solid ${style.ringColor}`,
              background: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
          {/* カテゴリバッジ */}
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: `${size * 0.35}px`,
            height: `${size * 0.35}px`,
            background: style.bgColor,
            borderRadius: style.shape === 'square' ? '3px' : style.shape === 'diamond' ? '3px' : '50%',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.2}px`,
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            zIndex: 2,
            transform: style.shape === 'diamond' ? 'rotate(45deg)' : 'rotate(0deg)',
          }}>
            {style.shape !== 'diamond' && style.icon}
          </div>
          {/* アバター */}
          <div
            className={isDiaryRecent ? 'marker-glow' : ''}
            style={{
              position: 'relative',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: '3px solid white',
              overflow: 'hidden',
              background: style.bgColor,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={authorName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const next = (e.target as HTMLElement).nextElementSibling as HTMLElement
                  if (next) next.style.display = 'flex'
                }}
              />
            ) : null}
            <div style={{
              width: '100%', height: '100%',
              display: avatarUrl ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold',
              fontSize: `${size * 0.4}px`,
              background: style.bgColor,
            }}>
              {initials}
            </div>
          </div>
        </div>
        <style>{`
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
        `}</style>
      </Html>

      {/* コンパクトなホバーカード */}
      {isHovered && (
        // @ts-ignore
        <Html
          position={[0, 0.15, 0]}
          center
          distanceFactor={8}
          transform={false}
          occlude={false}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
          }}
        >
          <CompactPostCard post={marker.post} locationLabel={marker.locationLabel} />
        </Html>
      )}
    </group>
  )
}

// コンパクトなポストカード（w-72に縮小）
function CompactPostCard({ post, locationLabel }: { post: Post; locationLabel: string }) {
  const category = post.category || 'question'
  const color = getCategoryColor(category)
  const label = getCategoryLabel(category)
  const authorName = post.author?.name || '匿名'
  const avatarUrl = post.author?.icon_url
  const initials = authorName.charAt(0).toUpperCase()

  return (
    <Link href={`/posts/${post.id}`} className="block w-72 pointer-events-auto group">
      <div
        className="rounded-2xl p-4 backdrop-blur-xl border border-white/30 transition-all duration-200 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.4), rgba(14, 165, 233, 0.3), rgba(16, 185, 129, 0.3))',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.4)',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: color }}>
            {label}
          </span>
          {post.category === 'question' && post.urgency_level && !post.is_resolved && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: post.urgency_level === 'urgent' ? '#EF4444' : '#3B82F6' }}>
              {post.urgency_level === 'urgent' ? '緊急' : '通常'}
            </span>
          )}
          <span className="text-xs text-white/80 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* タイトル/コンテンツ */}
        <h3 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug">
          {category === 'chat' ? post.content : (post.title || 'タイトルなし')}
        </h3>
        {category !== 'chat' && (
          <p className="text-xs text-white/80 mb-3 line-clamp-2">{post.content}</p>
        )}

        {/* フッター */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt={authorName}
                className="w-7 h-7 rounded-full border-2 border-white/40 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: color }}>
                {initials}
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-white">{authorName}</span>
              {locationLabel && (
                <span className="text-xs text-white/60 block">📍 {locationLabel}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Heart className="h-3 w-3 fill-current" />{post.likes_count}
              </span>
            )}
            {post.comments_count > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <MessageSquare className="h-3 w-3" />{post.comments_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// 一括可視性管理コンポーネント
function MarkersManager({
  markers,
  hoveredPostId,
  setHoveredPostId,
  onMarkerClick,
}: {
  markers: MarkerData[]
  hoveredPostId: string | null
  setHoveredPostId: (id: string | null) => void
  onMarkerClick?: (post: Post) => void
}) {
  const { camera } = useThree()
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  // 単一のuseFrameで全マーカーの可視性を一括判定
  useFrame(() => {
    const cameraDir = camera.position.clone().normalize()
    const newVisible = new Set<string>()

    markers.forEach(marker => {
      const markerDir = marker.position.clone().normalize()
      if (markerDir.dot(cameraDir) > 0) {
        newVisible.add(marker.post.id)
      }
    })

    // 変化がある場合のみ更新
    if (newVisible.size !== visibleIds.size || Array.from(newVisible).some(id => !visibleIds.has(id))) {
      setVisibleIds(newVisible)
    }
  })

  return (
    <>
      {markers.map(marker => (
        <MarkerPin
          key={marker.post.id}
          marker={marker}
          isVisible={visibleIds.has(marker.post.id)}
          isHovered={hoveredPostId === marker.post.id}
          onHover={setHoveredPostId}
          onMarkerClick={onMarkerClick}
        />
      ))}
    </>
  )
}

// 3D地球コンポーネント
export function Earth3D({ posts, userPostData, onMarkerClick, selectedPostId }: Earth3DProps) {
  const earthGroupRef = useRef<THREE.Group>(null)
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null)
  const [earthBumpMap, setEarthBumpMap] = useState<THREE.Texture | null>(null)
  const [universityCache, setUniversityCache] = useState<Map<string, University>>(new Map())
  const universityFetchedRef = useRef(false)

  // 大学座標をバッチ取得
  useEffect(() => {
    const universityIds = Array.from(new Set(
      posts.map(p => p.author?.study_abroad_university_id).filter((id): id is string => !!id)
    ))

    if (universityIds.length === 0 || universityFetchedRef.current) return
    universityFetchedRef.current = true

    supabase
      .from('universities')
      .select('*, continent:continents(*)')
      .in('id', universityIds)
      .then(({ data }) => {
        if (data) {
          const cache = new Map<string, University>()
          data.forEach((uni: University) => cache.set(uni.id, uni))
          setUniversityCache(cache)
        }
      })
  }, [posts])

  // テクスチャの読み込み
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loader = new THREE.TextureLoader()
    const earthTextureUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
    const earthBumpUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'

    loader.load(earthTextureUrl, (texture) => {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      setEarthTexture(texture)
    }, undefined, () => {
      // フォールバック: 単色マテリアル
    })

    loader.load(earthBumpUrl, (texture) => {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      setEarthBumpMap(texture)
    }, undefined, () => {})
  }, [])

  const earthMaterial = useMemo(() => {
    if (!earthTexture) {
      return new THREE.MeshStandardMaterial({
        color: '#1e40af',
        roughness: 0.7,
        metalness: 0.3,
        emissive: '#0ea5e9',
        emissiveIntensity: 0.4,
      })
    }
    return new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: earthBumpMap || undefined,
      bumpScale: earthBumpMap ? 0.05 : 0,
      roughness: 0.8,
      metalness: 0.1,
    })
  }, [earthTexture, earthBumpMap])

  // 投稿を3D座標に変換（大学座標優先、国座標フォールバック）
  const postMarkers = useMemo(() => {
    // 大学座標を持つ投稿と持たない投稿を分離
    const withUniCoords: MarkerData[] = []
    const byCountry = new Map<string, Post[]>()

    posts.forEach(post => {
      const uniId = post.author?.study_abroad_university_id
      const uni = uniId ? universityCache.get(uniId) : null
      const userData = userPostData?.find(data => data.displayPost.id === post.id)
      const displayPost = userData ? userData.displayPost : post

      if (uni?.latitude != null && uni?.longitude != null) {
        withUniCoords.push({
          post: displayPost,
          userData,
          position: latLngToVector3(uni.latitude, uni.longitude, 2.02),
          category: displayPost.category || 'question',
          urgencyLevel: displayPost.urgency_level,
          isResolved: displayPost.is_resolved,
          isSelected: selectedPostId === displayPost.id,
          locationLabel: uni.name_ja || uni.name_en,
        })
      } else {
        const country = post.author?.study_abroad_destination || post.study_abroad_destination
        if (country) {
          if (!byCountry.has(country)) byCountry.set(country, [])
          byCountry.get(country)!.push(post)
        }
      }
    })

    // 国座標フォールバック
    const withCountryCoords: MarkerData[] = []
    byCountry.forEach((countryPosts, country) => {
      const baseCoords = getCountryCoordinates(country)
      if (!baseCoords) return

      countryPosts.forEach((post, index) => {
        const userData = userPostData?.find(data => data.displayPost.id === post.id)
        const displayPost = userData ? userData.displayPost : post
        const offsetCoords = getOffsetCoordinates(baseCoords, index, countryPosts.length)

        withCountryCoords.push({
          post: displayPost,
          userData,
          position: latLngToVector3(offsetCoords.lat, offsetCoords.lng, 2.02),
          category: displayPost.category || 'question',
          urgencyLevel: displayPost.urgency_level,
          isResolved: displayPost.is_resolved,
          isSelected: selectedPostId === displayPost.id,
          locationLabel: country,
        })
      })
    })

    return [...withUniCoords, ...withCountryCoords]
  }, [posts, userPostData, selectedPostId, universityCache])

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#0ea5e9" />

      <group ref={earthGroupRef}>
        {/* 地球 */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2, 64, 64]} />
          <primitive object={earthMaterial} attach="material" />
        </mesh>

        {/* グローエフェクト */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.05, 32, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>

        {/* 一括管理されたマーカー */}
        <MarkersManager
          markers={postMarkers}
          hoveredPostId={hoveredPostId}
          setHoveredPostId={setHoveredPostId}
          onMarkerClick={onMarkerClick}
        />
      </group>
    </>
  )
}
