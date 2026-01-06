import { supabase } from '../supabase'
import {
  createNotification,
  createNotificationsForUsers,
  notifyComment,
  notifyDM,
} from '../notifications'

// Supabaseをモック
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
    })),
  },
}))

describe('notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await createNotification({
        userId: 'user-1',
        type: 'comment',
        title: 'Test notification',
        content: 'Test content',
        linkUrl: '/posts/1',
      })

      expect(supabase.from).toHaveBeenCalledWith('notifications')
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        type: 'comment',
        title: 'Test notification',
        content: 'Test content',
        link_url: '/posts/1',
      })
    })

    it('should handle errors gracefully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await createNotification({
        userId: 'user-1',
        type: 'comment',
        title: 'Test notification',
      })

      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('createNotificationsForUsers', () => {
    it('should create notifications for multiple users', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await createNotificationsForUsers(
        ['user-1', 'user-2'],
        'announcement',
        'Test announcement',
        'Test content',
        '/announcements/1'
      )

      expect(mockInsert).toHaveBeenCalledWith([
        {
          user_id: 'user-1',
          type: 'announcement',
          title: 'Test announcement',
          content: 'Test content',
          link_url: '/announcements/1',
        },
        {
          user_id: 'user-2',
          type: 'announcement',
          title: 'Test announcement',
          content: 'Test content',
          link_url: '/announcements/1',
        },
      ])
    })

    it('should not create notifications for empty user array', async () => {
      const mockInsert = jest.fn()
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await createNotificationsForUsers(
        [],
        'announcement',
        'Test announcement'
      )

      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('notifyComment', () => {
    it('should create a comment notification', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await notifyComment('post-author-1', 'Commenter Name', 'Post Title', 'post-1')

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'post-author-1',
        type: 'comment',
        title: 'Commenter Nameさんがコメントしました',
        content: '「Post Title」にコメントがつきました',
        link_url: '/posts/post-1',
      })
    })
  })

  describe('notifyDM', () => {
    it('should create a DM notification', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      })

      await notifyDM('receiver-1', 'Sender Name', 'Message preview')

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'receiver-1',
        type: 'dm',
        title: 'Sender Nameさんからメッセージ',
        content: 'Message preview',
        link_url: '/chat/receiver-1',
      })
    })
  })
})

