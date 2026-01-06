import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// テスト用のカスタムレンダラー
// Providersは複雑なため、必要に応じて個別にモックする
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }

