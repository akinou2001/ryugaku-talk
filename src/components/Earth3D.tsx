'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Post, User } from '@/lib/supabase'
import { getCountryCoordinates } from '@/lib/countryCoordinates'
import { HelpCircle, BookOpen, MessageCircle, Clock, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface UserPostData {
  user: User
  posts: Post[]
  displayPost: Post
  displayType: 'question' | 'diary' | 'chat' | 'normal'
}

interface Earth3DProps {
  posts: Post[]
  userPostData?: UserPostData[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

// 球面座標を3D座標に変換（緯度・経度から）
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

// 投稿種別に応じたスタイルを取得（2Dマップと同じロジック）
function getCategoryStyle(category: string, urgencyLevel?: string, isResolved?: boolean) {
  const baseStyles = {
    question: {
      bgColor: '#3B82F6', // 青
      borderColor: '#2563EB',
      icon: '?',
      shape: 'circle' as const,
    },
    diary: {
      bgColor: '#10B981', // 緑
      borderColor: '#059669',
      icon: 'D',
      shape: 'square' as const,
    },
    chat: {
      bgColor: '#8B5CF6', // 紫
      borderColor: '#7C3AED',
      icon: 'C',
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

// 24時間以内かどうかを判定
function isWithin24Hours(createdAt: string): boolean {
  const now = new Date()
  const postDate = new Date(createdAt)
  const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)
  return hoursSincePost <= 24
}

// マーカーピンコンポーネント（常にカメラを向き、裏側では非表示）
function MarkerPin({
  marker,
  hoveredPostId,
  setHoveredPostId,
  onMarkerClick,
}: {
  marker: {
    post: Post
    userData?: UserPostData
    position: THREE.Vector3
    category: string
    urgencyLevel?: string
    isResolved?: boolean
    isSelected: boolean
    isHovered: boolean
  }
  hoveredPostId: string | null
  setHoveredPostId: (id: string | null) => void
  onMarkerClick?: (post: Post) => void
}) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const isVisibleRef = useRef(true)
  const [, forceUpdate] = useState(0)
  
  // 強制的に再レンダリングをトリガーする関数
  const triggerUpdate = () => {
    forceUpdate(prev => prev + 1)
  }

  const style = getCategoryStyle(marker.category, marker.urgencyLevel, marker.isResolved)
  const authorName = marker.post.author?.name || '匿名'
  const avatarUrl = marker.post.author?.icon_url
  const initials = authorName.charAt(0).toUpperCase()
  const isDiaryRecent = marker.category === 'diary' && isWithin24Hours(marker.post.created_at)
  const isQuestionUnresolved = marker.category === 'question' && !marker.isResolved
  const isChat = marker.category === 'chat'
  
  // 吹き出しに表示するテキストを決定
  const getBubbleText = () => {
    if (isChat) {
      return marker.post.content?.substring(0, 10) + (marker.post.content && marker.post.content.length > 10 ? '...' : '')
    } else if (marker.category === 'question' || marker.category === 'diary') {
      return marker.post.title?.substring(0, 10) + (marker.post.title && marker.post.title.length > 10 ? '...' : '') || ''
    }
    return ''
  }
  const bubbleText = getBubbleText()
  
  // ピンのサイズを1/10に縮小
  const baseSize = marker.isHovered || marker.isSelected ? 2.4 : 2
  const scale = marker.isHovered || marker.isSelected ? 1.15 : 1

  // フレームごとにカメラを向き、裏側かどうかを判定
  useFrame(() => {
    if (!groupRef.current) return

    // マーカーのワールド位置
    const markerPos = new THREE.Vector3()
    groupRef.current.getWorldPosition(markerPos)
    
    // 地球の中心からの方向ベクトル（正規化）
    const directionFromCenter = markerPos.clone().normalize()
    
    // カメラの位置
    const cameraPos = camera.position.clone()
    
    // カメラの方向ベクトル（正規化、地球の中心からカメラへの方向）
    const cameraDirection = cameraPos.clone().normalize()
    
    // ドット積で裏側かどうかを判定（-1に近いほど裏側）
    // マーカーとカメラが地球の反対側にある場合、ドット積は負の値になる
    const dotProduct = directionFromCenter.dot(cameraDirection)
    
    // 前面（カメラ側）の場合に表示（ドット積が0より大きい、つまり約90度未満）
    const visible = dotProduct > 0
    
    // 表示状態が変わった場合のみ更新
    if (isVisibleRef.current !== visible) {
      isVisibleRef.current = visible
      triggerUpdate()
    }
    
    if (!visible) return
    
    // ピンをカメラの方向に向ける（Google Earthのように常に正面を向く）
    // カメラからマーカーへの方向ベクトル
    const toMarker = new THREE.Vector3().subVectors(markerPos, cameraPos).normalize()
    
    // カメラのupベクトル（上下の向きを維持）
    const cameraUp = camera.up.clone()
    
    // 右方向ベクトルを計算（upとtoMarkerの外積）
    const right = new THREE.Vector3().crossVectors(cameraUp, toMarker).normalize()
    
    // 正規化されたupベクトルを再計算（toMarkerとrightの外積）
    const normalizedUp = new THREE.Vector3().crossVectors(toMarker, right).normalize()
    
    // クォータニオンを作成して回転を設定
    const quaternion = new THREE.Quaternion()
    const matrix = new THREE.Matrix4()
    
    // 行列を構築（rightが+X方向、normalizedUpが+Y方向、-toMarkerが+Z方向）
    // これにより、ピンが常にカメラを正面として向く
    matrix.makeBasis(
      right,
      normalizedUp,
      toMarker.clone().negate() // -Z方向（カメラの方向）に向ける
    )
    
    quaternion.setFromRotationMatrix(matrix)
    groupRef.current.quaternion.copy(quaternion)
  })

  if (!isVisibleRef.current) return null

  return (
    <group ref={groupRef} position={marker.position}>
      {/* 平面のピン（Htmlコンポーネントで実装、グループの回転でカメラを向く） */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={150}
        transform={false}
        occlude={false}
        style={{
          transform: 'translate(-50%, -50%) scale(0.1)',
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
      >
        <div
          className="custom-marker-wrapper"
          style={{
            position: 'relative',
            width: `${baseSize * 1.8}px`,
            height: `${baseSize * 1.8}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: `scale(${scale})`,
          }}
          onMouseEnter={() => setHoveredPostId(marker.post.id)}
          onMouseLeave={() => setHoveredPostId(null)}
          onClick={() => onMarkerClick?.(marker.post)}
        >
          {/* 外側のリング（投稿種別と緊急度表示） */}
          <div
            className="ring-element"
            style={{
              position: 'absolute',
              width: `${baseSize * 1.8}px`,
              height: `${baseSize * 1.8}px`,
              borderRadius: '50%',
              border: `${style.ringWidth}px solid ${style.ringColor}`,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
              boxShadow: `0 4px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5), 0 0 20px ${style.ringColor}30`,
              animation: isQuestionUnresolved ? 'pulse-ring 2s infinite' : isDiaryRecent ? 'sparkle 2s infinite' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          
          {/* キラキラエフェクト（24時間以内の日記） */}
          {isDiaryRecent && (
            <div
              style={{
                position: 'absolute',
                width: `${baseSize * 1.8}px`,
                height: `${baseSize * 1.8}px`,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                animation: 'sparkle-rotate 3s linear infinite',
                pointerEvents: 'none',
              }}
            />
          )}
          
          {/* 投稿種別の形状インジケーター（小さなバッジ） */}
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: `${baseSize * 0.35}px`,
              height: `${baseSize * 0.35}px`,
              background: style.bgColor,
              borderRadius: style.shape === 'square' ? '2px' : style.shape === 'diamond' ? '2px' : '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${baseSize * 0.18}px`,
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              zIndex: 2,
              transform: style.shape === 'diamond' ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            {style.shape !== 'diamond' && style.icon}
          </div>
          
          {/* メインアイコン（投稿者の画像） */}
          <div
            style={{
              position: 'relative',
              width: `${baseSize}px`,
              height: `${baseSize}px`,
              borderRadius: '50%',
              border: '4px solid white',
              overflow: 'hidden',
              background: style.bgColor,
              boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px ${style.bgColor}20, inset 0 2px 4px rgba(255,255,255,0.3)`,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isDiaryRecent ? 'sparkle-glow 2s infinite' : 'none',
              transition: 'all 0.3s ease',
            }}
            className="avatar-element"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={authorName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const next = (e.target as HTMLElement).nextElementSibling as HTMLElement
                  if (next) next.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: avatarUrl ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: `${baseSize * 0.4}px`,
                background: style.bgColor,
              }}
            >
              {initials}
            </div>
          </div>
          
        </div>
        <style jsx>{`
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
            transform: scale(${scale * 1.15}) !important;
          }
          .custom-marker-wrapper:hover .ring-element {
            box-shadow: 0 6px 16px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.6), 0 0 30px ${style.ringColor}50 !important;
            transform: scale(1.05);
          }
          .custom-marker-wrapper:hover .avatar-element {
            box-shadow: 0 6px 16px rgba(0,0,0,0.4), 0 0 0 3px ${style.bgColor}30, inset 0 2px 6px rgba(255,255,255,0.4) !important;
            transform: scale(1.1);
          }
        `}</style>
      </Html>

      {/* ホバー時のカード表示（ピンの上に表示、グループの回転でカメラを向く） */}
      {marker.isHovered && (
        <Html
          position={[0, baseSize * 0.15, 0]}
          center
          distanceFactor={120}
          transform={false}
          occlude={false}
          style={{
            pointerEvents: 'auto',
            transform: 'translateX(-50%) scale(0.1)',
            userSelect: 'none',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          <PostCard post={marker.post} userData={marker.userData} />
        </Html>
      )}
    </group>
  )
}

// グラスモーフィズムスタイルの投稿カード
function PostCard({ post, userData }: { post: Post; userData?: UserPostData }) {
  const category = post.category || 'question'
  const style = getCategoryStyle(category, post.urgency_level, post.is_resolved)
  const color = style.bgColor
  const authorName = post.author?.name || '匿名'
  const avatarUrl = post.author?.icon_url
  const initials = authorName.charAt(0).toUpperCase()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'たった今'
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const getCategoryIcon = () => {
    switch (category) {
      case 'question':
        return <HelpCircle className="h-4 w-4" />
      case 'diary':
        return <BookOpen className="h-4 w-4" />
      case 'chat':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getCategoryLabel = () => {
    switch (category) {
      case 'question':
        return '質問'
      case 'diary':
        return '日記'
      case 'chat':
        return 'つぶやき'
      default:
        return '投稿'
    }
  }

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block w-96 pointer-events-auto group"
    >
      <div
        className="rounded-3xl p-6 backdrop-blur-xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.4), rgba(14, 165, 233, 0.3), rgba(16, 185, 129, 0.3))',
          boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div
              className="px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-all group-hover:scale-110"
              style={{ 
                backgroundColor: color,
                boxShadow: `0 4px 12px ${color}40`,
              }}
            >
              {getCategoryIcon()}
              {getCategoryLabel()}
            </div>
            {post.category === 'question' && post.urgency_level && !post.is_resolved && (
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-md"
                style={{
                  backgroundColor:
                    post.urgency_level === 'urgent'
                      ? '#EF4444'
                      : post.urgency_level === 'high'
                      ? '#F59E0B'
                      : post.urgency_level === 'normal'
                      ? '#3B82F6'
                      : '#9CA3AF',
                  boxShadow: `0 2px 8px ${
                    post.urgency_level === 'urgent'
                      ? '#EF444440'
                      : post.urgency_level === 'high'
                      ? '#F59E0B40'
                      : post.urgency_level === 'normal'
                      ? '#3B82F640'
                      : '#9CA3AF40'
                  }`,
                }}
              >
                {post.urgency_level === 'urgent'
                  ? '緊急'
                  : post.urgency_level === 'high'
                  ? '高'
                  : post.urgency_level === 'normal'
                  ? '通常'
                  : '低'}
              </span>
            )}
          </div>
          <span className="text-xs text-white/90 flex items-center gap-1.5 font-medium bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(post.created_at)}
          </span>
        </div>

        {/* タイトル（つぶやきの場合はコンテンツを表示） */}
        {category === 'chat' ? (
          <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-snug group-hover:text-white/95 transition-colors">
            {post.content}
          </h3>
        ) : (
          <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-snug group-hover:text-white/95 transition-colors">
            {post.title || 'タイトルなし'}
          </h3>
        )}

        {/* コンテンツ（つぶやき以外） */}
        {category !== 'chat' && (
          <p className="text-sm text-white/85 mb-5 line-clamp-3 leading-relaxed">
            {post.content}
          </p>
        )}

        {/* フッター */}
        <div className="flex items-center justify-between pt-5 border-t border-white/30">
          <div className="flex items-center space-x-3">
            {avatarUrl ? (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={authorName}
                  className="w-10 h-10 rounded-full border-3 border-white/40 shadow-lg group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full border-3 border-white/40 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: color,
                  boxShadow: `0 4px 12px ${color}50`,
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-white block">{authorName}</span>
              {post.author?.study_abroad_destination && (
                <span className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                  {post.author.study_abroad_destination}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-white/90">
            {post.likes_count > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <Heart className="h-4 w-4 fill-current" />
                {post.likes_count}
              </span>
            )}
            {post.comments_count > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <MessageSquare className="h-4 w-4" />
                {post.comments_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// 3D地球の球体コンポーネント
export function Earth3D({ posts, userPostData, onMarkerClick, selectedPostId }: Earth3DProps) {
  const earthGroupRef = useRef<THREE.Group>(null) // 地球とピンをまとめるグループ
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)

  // スクロールとズームはOrbitControlsで制御されるため、自動回転は無効化

  // 地球のテクスチャ（実際の地球画像を使用）
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null)
  const [earthBumpMap, setEarthBumpMap] = useState<THREE.Texture | null>(null)
  
  // earthSpecularMapは削除（MeshStandardMaterialでは使用しない）

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loader = new THREE.TextureLoader()
    
    // 地球の基本テクスチャ（無料で利用可能なNASA Blue Marble風の画像）
    const earthTextureUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
    const earthBumpUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'

    // フォールバック用のシンプルな地球テクスチャ（上記が読み込めない場合）
    const fallbackTextureUrl = 'https://i.imgur.com/VdQy8xg.jpg' // シンプルな地球テクスチャ

    // テクスチャを読み込む
    loader.load(
      earthTextureUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        setEarthTexture(texture)
      },
      undefined,
      () => {
        // エラー時はフォールバックを使用
        console.warn('地球テクスチャの読み込みに失敗しました。フォールバックを使用します。')
        loader.load(
          fallbackTextureUrl,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            setEarthTexture(texture)
          }
        )
      }
    )

    // 法線マップ（凹凸感）を読み込む（オプション）
    loader.load(
      earthBumpUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        setEarthBumpMap(texture)
      },
      undefined,
      () => {
        // エラー時は無視（オプションなので）
      }
    )

    // スペキュラーマップはMeshStandardMaterialでは使用しない（MeshPhongMaterialで使用される）
    // 今回は読み込まない
  }, [])

  // 地球のマテリアル
  const earthMaterial = useMemo(() => {
    if (!earthTexture) {
      // テクスチャがまだ読み込まれていない場合のフォールバック
      return new THREE.MeshStandardMaterial({
        color: '#1e40af',
        roughness: 0.7,
        metalness: 0.3,
        emissive: '#0ea5e9',
        emissiveIntensity: 0.4,
      })
    }

    const material = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: earthBumpMap || undefined,
      bumpScale: earthBumpMap ? 0.05 : 0,
      roughness: 0.8,
      metalness: 0.1,
      emissive: '#000000',
      emissiveIntensity: 0,
    })
    
    // specularMapはMeshStandardMaterialにはないので、使用しない
    // 代わりにroughnessで光沢を調整
    
    return material
  }, [earthTexture, earthBumpMap])

  // 投稿を3D座標に変換
  const postMarkers = useMemo(() => {
    console.log('🌍 Earth3D: 投稿マーカーを生成中...', { postsCount: posts.length })
    
    const markers = posts.map((post) => {
      // 位置情報の取得：投稿自体のstudy_abroad_destinationを優先、なければ著者のものを使用
      const postCountry = post.study_abroad_destination
      const authorCountry = post.author?.study_abroad_destination
      const country = postCountry || authorCountry || null
      
      console.log('📍 位置情報確認:', { 
        postId: post.id, 
        postTitle: post.title?.substring(0, 30),
        postCountry: postCountry || '(なし)',
        authorCountry: authorCountry || '(なし)',
        finalCountry: country || '(なし)'
      })
      
      if (!country) {
        console.warn('❌ 位置情報なし:', { 
          postId: post.id, 
          postTitle: post.title?.substring(0, 30)
        })
        return null
      }

      const coords = getCountryCoordinates(country)
      
      if (!coords) {
        console.warn('❌ 座標が見つかりません:', { 
          postId: post.id, 
          country,
          title: post.title?.substring(0, 30)
        })
        return null
      }

      console.log('✅ マーカー生成成功:', { 
        postId: post.id, 
        country, 
        coords,
        title: post.title?.substring(0, 30)
      })

      const userData = userPostData?.find(data => data.displayPost.id === post.id)
      const displayPost = userData ? userData.displayPost : post

      return {
        post: displayPost,
        userData,
        position: latLngToVector3(coords.lat, coords.lng, 2.02), // 地球の半径より少し外側に配置
        category: displayPost.category || 'question',
        urgencyLevel: displayPost.urgency_level,
        isResolved: displayPost.is_resolved,
        isSelected: selectedPostId === displayPost.id,
        isHovered: hoveredPostId === displayPost.id,
        country, // デバッグ用
      }
    }).filter(Boolean) as Array<{
      post: Post
      userData?: UserPostData
      position: THREE.Vector3
      category: string
      urgencyLevel?: string
      isResolved?: boolean
      isSelected: boolean
      isHovered: boolean
      country: string
    }>
    
    console.log('🌍 Earth3D: マーカー生成完了', { 
      totalPosts: posts.length, 
      validMarkers: markers.length,
      markers: markers.map(m => ({ country: m.country, postId: m.post.id, title: m.post.title?.substring(0, 30) }))
    })
    
    return markers
  }, [posts, userPostData, selectedPostId, hoveredPostId])

  return (
    <>
      {/* 環境光（グループの外に配置） */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#0ea5e9" />

      {/* 地球とピンをまとめるグループ（このグループ全体を回転させる） */}
      <group ref={earthGroupRef}>
        {/* 地球の球体 */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2, 64, 64]} />
          <primitive object={earthMaterial} attach="material" />
        </mesh>

        {/* グローエフェクト用の外側の球体 */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.05, 32, 32]} />
          <meshBasicMaterial
            color="#10b981" // エメラルドグリーン
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 投稿マーカー（地球と同じグループ内に配置） */}
        {postMarkers.map((marker) => (
          <MarkerPin
            key={marker.post.id}
            marker={marker}
            hoveredPostId={hoveredPostId}
            setHoveredPostId={setHoveredPostId}
            onMarkerClick={onMarkerClick}
          />
        ))}
      </group>
    </>
  )
}

