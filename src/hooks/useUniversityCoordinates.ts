import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import type { University } from '@/lib/universities'
import { getCountryCoordinates } from '@/lib/countryCoordinates'
import { getOffsetCoordinates } from '@/lib/mapUtils'

export interface PostCoordinate {
  post: Post
  coords: { lat: number; lng: number }
  locationLabel: string
}

// 大学座標をバッチ取得し、投稿ごとの座標を返すフック
export function useUniversityCoordinates(posts: Post[]) {
  const [postCoordinates, setPostCoordinates] = useState<PostCoordinate[]>([])
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef<Map<string, University>>(new Map())

  useEffect(() => {
    if (posts.length === 0) {
      setPostCoordinates([])
      return
    }

    let cancelled = false

    const fetchCoordinates = async () => {
      setLoading(true)

      // 大学IDを重複排除で収集
      const universityIds = Array.from(new Set(
        posts
          .map(p => p.author?.study_abroad_university_id)
          .filter((id): id is string => !!id)
      ))

      // キャッシュにないIDだけ取得
      const uncachedIds = universityIds.filter(id => !cacheRef.current.has(id))

      if (uncachedIds.length > 0) {
        const { data } = await supabase
          .from('universities')
          .select('*, continent:continents(*)')
          .in('id', uncachedIds)

        if (data) {
          data.forEach((uni: University) => {
            cacheRef.current.set(uni.id, uni)
          })
        }
      }

      if (cancelled) return

      // 大学座標を持つ投稿と持たない投稿を分離
      const withUniCoords: PostCoordinate[] = []
      const byCountry = new Map<string, Post[]>()

      posts.forEach(post => {
        const uniId = post.author?.study_abroad_university_id
        const uni = uniId ? cacheRef.current.get(uniId) : null

        if (uni?.latitude != null && uni?.longitude != null) {
          withUniCoords.push({
            post,
            coords: { lat: uni.latitude, lng: uni.longitude },
            locationLabel: uni.name_ja || uni.name_en,
          })
        } else {
          const country = post.author?.study_abroad_destination || '不明'
          if (!byCountry.has(country)) byCountry.set(country, [])
          byCountry.get(country)!.push(post)
        }
      })

      // 国座標フォールバック（オフセット付き）
      const withCountryCoords: PostCoordinate[] = []
      byCountry.forEach((countryPosts, country) => {
        const baseCoords = getCountryCoordinates(country)
        if (!baseCoords) return

        countryPosts.forEach((post, index) => {
          withCountryCoords.push({
            post,
            coords: getOffsetCoordinates(baseCoords, index, countryPosts.length),
            locationLabel: country,
          })
        })
      })

      if (!cancelled) {
        setPostCoordinates([...withUniCoords, ...withCountryCoords])
        setLoading(false)
      }
    }

    fetchCoordinates()

    return () => { cancelled = true }
  }, [posts])

  return { postCoordinates, loading }
}
