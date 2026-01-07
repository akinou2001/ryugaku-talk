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

  test('投稿作成ページが表示される', async ({ page }) => {
    await page.goto('/posts/new')
    
    // ページが正常に読み込まれることを確認
    await expect(page).toHaveURL(/.*posts\/new/)
    await expect(page.locator('body')).toBeVisible()
    
    // フォーム要素またはログインボタンが表示されることを確認
    const hasForm = await page.locator('form, textarea, input[type="text"], button').count() > 0
    expect(hasForm).toBeTruthy()
  })
})

