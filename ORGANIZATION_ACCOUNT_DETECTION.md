# 組織アカウントの判別と出し分けの仕組み

## 1. データベースレベルでの判別

### `profiles`テーブルの`account_type`カラム
```sql
account_type TEXT DEFAULT 'individual' 
CHECK (account_type IN ('individual', 'educational', 'company', 'government'))
```

- `'individual'` = 個人アカウント
- `'educational'` = 教育機関
- `'company'` = 企業
- `'government'` = 政府機関

**場所**: `supabase-schema-organization-accounts.sql` または `supabase-schema-community.sql`

## 2. 型定義

### `src/lib/supabase.ts`
```typescript
export type AccountType = 'individual' | 'educational' | 'company' | 'government'

export interface User {
  id: string
  name: string
  account_type: AccountType  // ← ここで判別
  verification_status: VerificationStatus
  organization_name?: string
  // ... その他のフィールド
}
```

## 3. プロフィールデータの取得

### `src/components/Providers.tsx` - `fetchUserProfile`関数
```typescript
const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')  // account_typeを含む全フィールドを取得
    .eq('id', userId)
    .single()
  
  setUser(data)  // userオブジェクトにaccount_typeが含まれる
}
```

**取得されるデータ**:
- ログイン中のユーザー: `useAuth().user.account_type`
- 投稿の作成者: `post.author.account_type`
- プロフィール表示: `profile.account_type`

## 4. 判別ロジック（組織アカウントかどうか）

### 基本的な判別方法
```typescript
// 組織アカウントかどうか
const isOrganization = account_type !== 'individual'

// または
const isOrganization = ['educational', 'company', 'government'].includes(account_type)
```

### 使用箇所の例

#### `src/components/AccountBadge.tsx` (20行目)
```typescript
const isOrganization = accountType !== 'individual'
if (!isOrganization) return null  // 個人アカウントはバッジを表示しない
```

#### `src/app/profile/[id]/page.tsx` (147行目)
```typescript
const isOrganizationAccount = profile.account_type !== 'individual'
const pageTitle = isOrganizationAccount ? '組織プロフィール' : 'プロフィール'
```

#### `src/app/timeline/page.tsx` (1072行目)
```typescript
const isOrganizationPost = post.author && post.author.account_type !== 'individual'
const getOrganizationBorderColor = () => {
  if (!isOrganizationPost) return ''
  switch (post.author?.account_type) {
    case 'educational': return 'border-l-4 border-l-blue-500'
    case 'company': return 'border-l-4 border-l-green-500'
    case 'government': return 'border-l-4 border-l-purple-500'
    default: return ''
  }
}
```

## 5. 表示の出し分け

### AccountBadgeコンポーネント
**場所**: `src/components/AccountBadge.tsx`

```typescript
// 組織アカウントの場合のみバッジを表示
if (!isOrganization) return null

// アカウントタイプに応じたアイコンと色を表示
switch (accountType) {
  case 'educational': return <GraduationCap /> // 青
  case 'company': return <Briefcase /> // 緑
  case 'government': return <Shield /> // 紫
}
```

### 使用されている場所
- `src/app/profile/[id]/page.tsx` - プロフィールページ
- `src/app/timeline/page.tsx` - タイムラインページ
- `src/app/board/page.tsx` - 掲示板ページ
- `src/app/posts/[id]/page.tsx` - 投稿詳細ページ
- `src/components/RecentPosts.tsx` - 最近の投稿
- `src/app/communities/[id]/page.tsx` - コミュニティ詳細ページ

## 6. 機能の出し分け

### コミュニティ作成
**場所**: `src/app/communities/new/page.tsx`
```typescript
// 個人アカウントはギルドのみ、組織アカウントは公式コミュニティのみ
const canCreateGuild = user && user.account_type === 'individual'
const canCreateOfficial = user.account_type !== 'individual' && 
                          user.verification_status === 'verified'
```

### 公式投稿
**場所**: `src/app/posts/new/page.tsx`
```typescript
const isVerifiedOrganization = 
  user.account_type !== 'individual' && 
  user.verification_status === 'verified'
```

### 認証申請
**場所**: `src/app/verification/request/page.tsx`
```typescript
if (user.account_type === 'individual') {
  router.push('/')  // 個人アカウントは認証申請不可
}
```

## 7. データフロー

```
1. ユーザー登録
   ↓
2. profilesテーブルにaccount_typeを保存
   (signUp関数で設定: 'individual' or 'educational'/'company'/'government')
   ↓
3. ログイン時にfetchUserProfileで取得
   ↓
4. userオブジェクトにaccount_typeが含まれる
   ↓
5. 各ページでuser.account_typeをチェック
   ↓
6. 条件に応じてUIや機能を出し分け
```

## 8. 主な判別箇所の一覧

| ファイル | 行数 | 判別内容 |
|---------|------|---------|
| `src/components/AccountBadge.tsx` | 20 | バッジ表示の有無 |
| `src/app/profile/[id]/page.tsx` | 147, 195 | ページタイトル、組織情報表示 |
| `src/app/timeline/page.tsx` | 1072 | 投稿カードの色分け |
| `src/app/board/page.tsx` | 284 | 投稿カードの色分け |
| `src/app/communities/new/page.tsx` | 86, 88 | コミュニティ作成権限 |
| `src/app/posts/new/page.tsx` | 184 | 公式投稿権限 |
| `src/components/Header.tsx` | 65, 94, 190 | メニュー表示の出し分け |
| `src/app/verification/request/page.tsx` | 32 | 認証申請ページへのアクセス制御 |

## まとめ

- **判別方法**: `account_type !== 'individual'` で組織アカウントを判別
- **データ取得**: `profiles`テーブルから`account_type`を取得
- **表示**: `AccountBadge`コンポーネントでバッジ表示
- **機能制御**: 各ページで`user.account_type`をチェックして機能を出し分け

