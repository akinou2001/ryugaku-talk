import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ログインページにアクセスできる', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page).toHaveURL(/.*signin/)
    await expect(page.locator('h1, h2')).toContainText(/ログイン|サインイン/i)
  })

  test('新規登録ページにアクセスできる', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page).toHaveURL(/.*signup/)
    await expect(page.locator('h1, h2')).toContainText(/新規登録|サインアップ/i)
  })

  test('未ログイン時にタイムラインページにアクセスできる', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page).toHaveURL(/.*timeline/)
  })

  test('未ログイン時に投稿作成ページにアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/posts/new')
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*signin/)
  })
})

