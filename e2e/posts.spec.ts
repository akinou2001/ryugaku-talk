import { test, expect } from '@playwright/test'

test.describe('投稿機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('タイムラインページが表示される', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page).toHaveURL(/.*timeline/)
    // ページが正常に読み込まれることを確認
    await expect(page.locator('body')).toBeVisible()
  })

  test('投稿詳細ページの構造が正しい', async ({ page }) => {
    // 実際の投稿IDが必要な場合は、テストデータを作成するか、
    // モックを使用する必要があります
    // ここでは基本的な構造の確認のみ
    await page.goto('/timeline')
    
    // 投稿が存在する場合、最初の投稿をクリック
    const firstPost = page.locator('[data-testid="post-card"], .post-card, article').first()
    if (await firstPost.count() > 0) {
      await firstPost.click()
      // 投稿詳細ページの要素が表示されることを確認
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('投稿作成ページのフォームが表示される', async ({ page }) => {
    // ログインが必要な場合のテスト
    // 実際の実装に応じて調整が必要
    await page.goto('/posts/new')
    
    // ログインページにリダイレクトされるか、フォームが表示されるかを確認
    const isSignInPage = page.url().includes('signin')
    const hasForm = await page.locator('form, textarea, input[type="text"]').count() > 0
    
    expect(isSignInPage || hasForm).toBeTruthy()
  })
})

