'use client'

import { useState, useEffect } from 'react'
import type { Post, User } from '@/lib/supabase'

interface UserPostData {
  user: User
  posts: Post[]
  displayPost: Post
  displayType: 'question' | 'diary' | 'chat' | 'normal'
}

interface Globe3DCanvasProps {
  posts: Post[]
  userPostData?: UserPostData[]
  onMarkerClick?: (post: Post) => void
  selectedPostId?: string | null
}

export function Globe3DCanvas({ posts, userPostData, onMarkerClick, selectedPostId }: Globe3DCanvasProps) {
  const [isClient, setIsClient] = useState(false)
  const [r3fLoaded, setR3fLoaded] = useState(false)
  const [Components, setComponents] = useState<{
    Canvas: any
    OrbitControls: any
  } | null>(null)

  console.log('Globe3DCanvas component mounted with posts:', posts.length)

  useEffect(() => {
    setIsClient(true)
    console.log('Starting to load react-three/fiber...')

    // 動的にreact-three/fiberとdreiを読み込む
    Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei')
    ])
      .then(([r3f, drei]) => {
        console.log('✅ react-three/fiber loaded:', r3f)
        console.log('✅ react-three/drei loaded:', drei)
        setComponents({
          Canvas: r3f.Canvas,
          OrbitControls: drei.OrbitControls
        })
        setR3fLoaded(true)
      })
      .catch((error) => {
        console.error('❌ Failed to load react-three/fiber:', error)
      })
  }, [])

  console.log('Globe3DCanvas render check:', { 
    isClient, 
    window: typeof window, 
    r3fLoaded, 
    hasComponents: !!Components 
  })

  if (!isClient || !r3fLoaded || !Components) {
    return (
      <div className="flex items-center justify-center h-full relative">
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-white/30 border-t-white mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-14 w-14 border-4 border-white/20"></div>
          </div>
          <p className="text-white mt-5 font-medium text-base">3Dライブラリを読み込み中...</p>
          <p className="text-white/70 mt-2 text-sm">初回読み込みは少し時間がかかります</p>
        </div>
      </div>
    )
  }

  const { Canvas } = Components
  const { OrbitControls } = Components
  const { Earth3D } = require('@/components/Earth3D')

  const CanvasComponent = () => (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      onCreated={(state: any) => {
        console.log('Canvas created:', state)
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={4}
        maxDistance={15}
        autoRotate={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
      <Earth3D
        posts={posts}
        userPostData={userPostData}
        onMarkerClick={onMarkerClick}
        selectedPostId={selectedPostId}
      />
    </Canvas>
  )

  console.log('Globe3DCanvas: Rendering Canvas component')
  console.log('Rendering Canvas with posts:', posts.length)

  return <CanvasComponent />
}

