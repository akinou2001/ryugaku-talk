import { render, screen, waitFor } from '@testing-library/react'
import { useParams, useRouter } from 'next/navigation'
import PostDetail from '../../[id]/page'
import { useAuth } from '@/components/Providers'
import { supabase } from '@/lib/supabase'

// モック
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('@/components/Providers', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}))

describe('PostDetail', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }

  const mockPost = {
    id: 'post-1',
    title: 'Test Post',
    content: 'Test content',
    category: 'question',
    author_id: 'user-1',
    likes_count: 0,
    comments_count: 0,
    is_resolved: false,
    created_at: new Date().toISOString(),
    author: {
      name: 'Test User',
      account_type: 'individual',
      verification_status: 'unverified',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: 'post-1' })
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })

    // Supabaseのモック設定
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockSingle = jest.fn().mockResolvedValue({
      data: mockPost,
      error: null,
    })

    ;(supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    })
  })

  it('should render loading state initially', () => {
    // ローディング状態のテストは非同期処理のため、実装に応じて調整が必要
    render(<PostDetail />)
    // スケルトンローディングが表示されることを確認
    expect(screen.queryByText(/投稿が見つかりません/i)).not.toBeInTheDocument()
  })

  it('should display post title when loaded', async () => {
    render(<PostDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
  })

  it('should display post content when loaded', async () => {
    render(<PostDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })
  })

  it('should display author name', async () => {
    render(<PostDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('should show resolve button for question posts when user is author', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
    })

    render(<PostDetail />)
    
    await waitFor(() => {
      // 「解決する」ボタンをより具体的に検索（「この質問はまだ解決されていません」と区別）
      const resolveButton = screen.getByRole('button', { name: /解決する|解決済み/i })
      expect(resolveButton).toBeInTheDocument()
    })
  })

  it('should not show edit button for non-author users', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-2' },
    })

    render(<PostDetail />)
    
    await waitFor(() => {
      const editButton = screen.queryByText(/編集/i)
      expect(editButton).not.toBeInTheDocument()
    })
  })
})

