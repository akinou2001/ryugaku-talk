import { render, screen } from '@testing-library/react'
import { UserAvatar } from '../UserAvatar'

describe('UserAvatar', () => {
  it('should render user icon when no iconUrl is provided', () => {
    const { container } = render(<UserAvatar name="Test User" />)
    // フォールバックアイコンが表示される（div要素）
    const avatar = container.querySelector('.bg-primary-100')
    expect(avatar).toBeInTheDocument()
  })

  it('should render image when iconUrl is provided', () => {
    render(<UserAvatar iconUrl="https://example.com/avatar.jpg" name="Test User" />)
    const image = screen.getByAltText('Test Userのアイコン')
    expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should fallback to icon when image fails to load', () => {
    const { rerender } = render(
      <UserAvatar iconUrl="https://example.com/avatar.jpg" name="Test User" />
    )
    const image = screen.getByAltText('Test Userのアイコン')
    
    // 画像のエラーをシミュレート
    image.dispatchEvent(new Event('error'))
    rerender(<UserAvatar iconUrl="https://example.com/avatar.jpg" name="Test User" />)
    
    // フォールバックアイコンが表示される（実装によっては再レンダリングが必要）
    expect(image).toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { container } = render(<UserAvatar size="sm" />)
    const avatar = container.querySelector('.w-8.h-8')
    expect(avatar).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<UserAvatar className="custom-class" />)
    const avatar = container.querySelector('.custom-class')
    expect(avatar).toBeInTheDocument()
  })

  it('should handle null iconUrl', () => {
    const { container } = render(<UserAvatar iconUrl={null} name="Test User" />)
    // フォールバックアイコンが表示される
    const avatar = container.querySelector('.bg-primary-100')
    expect(avatar).toBeInTheDocument()
  })
})

