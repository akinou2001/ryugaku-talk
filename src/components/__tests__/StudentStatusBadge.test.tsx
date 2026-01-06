import { render, screen } from '@testing-library/react'
import { StudentStatusBadge } from '../StudentStatusBadge'

describe('StudentStatusBadge', () => {
  it('should not render when no status is provided', () => {
    const { container } = render(<StudentStatusBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('should render current student badge', () => {
    render(<StudentStatusBadge studentStatus="current" />)
    expect(screen.getByText('現役留学生')).toBeInTheDocument()
  })

  it('should render experienced student badge', () => {
    render(<StudentStatusBadge studentStatus="experienced" />)
    expect(screen.getByText('留学経験者')).toBeInTheDocument()
  })

  it('should render applicant badge', () => {
    render(<StudentStatusBadge studentStatus="applicant" />)
    expect(screen.getByText('留学希望者')).toBeInTheDocument()
  })

  it('should derive status from languages array', () => {
    render(<StudentStatusBadge languages={['status:current']} />)
    expect(screen.getByText('現役留学生')).toBeInTheDocument()
  })

  it('should handle experienced status from languages', () => {
    render(<StudentStatusBadge languages={['status:experienced']} />)
    expect(screen.getByText('留学経験者')).toBeInTheDocument()
  })

  it('should handle applicant status from languages', () => {
    render(<StudentStatusBadge languages={['status:applicant']} />)
    expect(screen.getByText('留学希望者')).toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { container } = render(
      <StudentStatusBadge studentStatus="current" size="sm" />
    )
    const badge = container.querySelector('.text-xs')
    expect(badge).toBeInTheDocument()
  })

  it('should prioritize studentStatus over languages', () => {
    render(
      <StudentStatusBadge
        studentStatus="experienced"
        languages={['status:current']}
      />
    )
    expect(screen.getByText('留学経験者')).toBeInTheDocument()
    expect(screen.queryByText('現役留学生')).not.toBeInTheDocument()
  })
})

