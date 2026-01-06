import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownEditor } from '../MarkdownEditor'

describe('MarkdownEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: '投稿の内容をMarkdown形式で記述できます。',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render textarea with value', () => {
    render(<MarkdownEditor {...defaultProps} value="Test content" />)
    const textarea = screen.getByPlaceholderText(/投稿の内容/i) as HTMLTextAreaElement
    expect(textarea.value).toBe('Test content')
  })

  it('should call onChange when textarea value changes', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<MarkdownEditor {...defaultProps} onChange={onChange} />)
    
    const textarea = screen.getByPlaceholderText(/投稿の内容/i)
    await user.type(textarea, 'New content')
    
    expect(onChange).toHaveBeenCalled()
  })

  it('should insert heading 1 when button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<MarkdownEditor {...defaultProps} value="Test" onChange={onChange} />)
    
    const heading1Button = screen.getByTitle('見出し大')
    await user.click(heading1Button)
    
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('# 見出し1'))
  })

  it('should insert heading 2 when button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<MarkdownEditor {...defaultProps} value="Test" onChange={onChange} />)
    
    const heading2Button = screen.getByTitle('見出し小')
    await user.click(heading2Button)
    
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('## 見出し2'))
  })

  it('should insert bold text when button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<MarkdownEditor {...defaultProps} value="Test" onChange={onChange} />)
    
    const boldButton = screen.getByTitle('太字')
    await user.click(boldButton)
    
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('**太字テキスト**'))
  })

  it('should insert italic text when button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<MarkdownEditor {...defaultProps} value="Test" onChange={onChange} />)
    
    const italicButton = screen.getByTitle('斜体')
    await user.click(italicButton)
    
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('*斜体テキスト*'))
  })

  it('should show link dialog when link button is clicked', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor {...defaultProps} />)
    
    const linkButton = screen.getByTitle('URL')
    await user.click(linkButton)
    
    expect(screen.getByText('リンクを挿入')).toBeInTheDocument()
  })

  it('should insert link when URL is provided', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<MarkdownEditor {...defaultProps} value="Test" onChange={onChange} />)
    
    const linkButton = screen.getByTitle('URL')
    await user.click(linkButton)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    await user.type(urlInput, 'https://example.com')
    
    const insertButton = screen.getByText('挿入')
    await user.click(insertButton)
    
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('[リンクテキスト](https://example.com)'))
  })

  it('should handle image file selection', async () => {
    const user = userEvent.setup()
    const onImageSelect = jest.fn()
    render(<MarkdownEditor {...defaultProps} onImageSelect={onImageSelect} />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const imageInput = screen.getByTitle('画像').querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(imageInput, file)
    
    expect(onImageSelect).toHaveBeenCalledWith(file)
  })

  it('should use custom placeholder', () => {
    render(<MarkdownEditor {...defaultProps} placeholder="Custom placeholder" />)
    const textarea = screen.getByPlaceholderText('Custom placeholder')
    expect(textarea).toBeInTheDocument()
  })

  it('should apply custom rows prop', () => {
    const { container } = render(<MarkdownEditor {...defaultProps} rows={20} />)
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveAttribute('rows', '20')
  })
})

