import { render, screen } from '@testing-library/react'
import { AccountBadge } from '../AccountBadge'

describe('AccountBadge', () => {
  it('should not render for individual accounts', () => {
    const { container } = render(
      <AccountBadge accountType="individual" verificationStatus="unverified" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render educational account badge', () => {
    render(
      <AccountBadge accountType="educational" verificationStatus="verified" />
    )
    expect(screen.getByText('教育機関')).toBeInTheDocument()
  })

  it('should render company account badge', () => {
    render(
      <AccountBadge accountType="company" verificationStatus="verified" />
    )
    expect(screen.getByText('企業')).toBeInTheDocument()
  })

  it('should render government account badge', () => {
    render(
      <AccountBadge accountType="government" verificationStatus="verified" />
    )
    expect(screen.getByText('政府機関')).toBeInTheDocument()
  })

  it('should show verification checkmark when verified', () => {
    const { container } = render(
      <AccountBadge accountType="educational" verificationStatus="verified" />
    )
    // CheckCircleアイコンが存在することを確認（lucide-reactのアイコンはSVGとしてレンダリングされる）
    const checkIcon = container.querySelector('svg')
    expect(checkIcon).toBeInTheDocument()
  })

  it('should display organization name when provided and size is not sm', () => {
    render(
      <AccountBadge
        accountType="educational"
        verificationStatus="verified"
        organizationName="Test University"
        size="md"
      />
    )
    expect(screen.getByText('(Test University)')).toBeInTheDocument()
  })

  it('should not display organization name when size is sm', () => {
    const { queryByText } = render(
      <AccountBadge
        accountType="educational"
        verificationStatus="verified"
        organizationName="Test University"
        size="sm"
      />
    )
    expect(queryByText('(Test University)')).not.toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { container } = render(
      <AccountBadge accountType="educational" verificationStatus="verified" size="sm" />
    )
    const badge = container.querySelector('.text-xs')
    expect(badge).toBeInTheDocument()
  })
})

