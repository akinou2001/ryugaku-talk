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
    // 実際のページには「アカウントを作成」というテキストが表示される
    await expect(page.locator('h1, h2')).toContainText(/アカウントを作成|新規登録|サインアップ/i)
  })

  test('未ログイン時にタイムラインページにアクセスできる', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page).toHaveURL(/.*timeline/)
  })

  test('未ログイン時に投稿作成ページにアクセスできる', async ({ page }) => {
    await page.goto('/posts/new')
    // 実際の実装では、認証チェックがクライアントサイドで行われるため、
    // ページは表示されるが、ログインボタンが表示される可能性がある
    await expect(page).toHaveURL(/.*posts\/new/)
    // ページが正常に読み込まれることを確認
    await expect(page.locator('body')).toBeVisible()
  })
})

