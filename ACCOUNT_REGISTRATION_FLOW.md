# アカウント登録フローとaccount_typeの保存

## ✅ 実装状況

### 1. 登録画面でのアカウントタイプ選択

**ファイル**: `src/app/auth/signup/page.tsx`

- ✅ アカウントタイプを選択可能（185行目）
  - 個人（individual）
  - 教育機関（educational）
  - 企業（company）
  - 政府機関（government）

```typescript
const [accountType, setAccountType] = useState<AccountType>('individual')

// UIで選択可能
{(['individual', 'educational', 'company', 'government'] as AccountType[]).map((type) => (
  <button onClick={() => setAccountType(type)}>
    {getAccountTypeLabel(type)}
  </button>
))}
```

### 2. signUp関数でのaccount_type保存

**ファイル**: `src/components/Providers.tsx` (188行目)

```typescript
const profileData: any = {
  id: data.user.id,
  email: normalizedEmail,
  name,
  account_type: accountType,  // ← ここでaccount_typeを設定
  contribution_score: 0,
  languages: [],
  verification_status: accountType === 'individual' ? 'unverified' : 'pending',
  is_admin: false,
  is_active: true
}

// profilesテーブルにINSERT
const { error: profileError } = await supabase
  .from('profiles')
  .insert(profileData)  // account_typeが含まれる
```

### 3. データベーススキーマ

**ファイル**: `supabase-schema-organization-accounts.sql` (6行目)

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' 
CHECK (account_type IN ('individual', 'educational', 'company', 'government'));
```

## 🔍 動作確認

### 登録フロー

1. **ユーザーが登録画面でアカウントタイプを選択**
   - 個人、教育機関、企業、政府機関から選択

2. **組織アカウントの場合、追加情報を入力**
   - 組織名
   - 組織種別
   - 担当者名
   - 担当者メールアドレス
   - 担当者電話番号

3. **signUp関数が呼ばれる**
   - `accountType`パラメータが渡される
   - `profileData`に`account_type`が含まれる

4. **profilesテーブルにINSERT**
   - `account_type`カラムに値が保存される
   - 組織アカウントの場合、組織情報も保存される

## ⚠️ 注意事項

### データベースマイグレーションが必要

`account_type`カラムが`profiles`テーブルに存在しない場合、登録時にエラーが発生します。

**必要なSQLマイグレーション**:
```sql
-- supabase-schema-organization-accounts.sql を実行
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' 
CHECK (account_type IN ('individual', 'educational', 'company', 'government'));
```

### 確認方法

1. Supabaseダッシュボードで`profiles`テーブルを確認
2. `account_type`カラムが存在するか確認
3. 存在しない場合は、`supabase-schema-organization-accounts.sql`を実行

## 📝 テスト手順

1. **登録画面にアクセス**
   - `/auth/signup`

2. **アカウントタイプを選択**
   - 個人、教育機関、企業、政府機関のいずれかを選択

3. **必要情報を入力**
   - 個人: 名前、メールアドレス、パスワード
   - 組織: 上記 + 組織情報

4. **登録を実行**
   - 「アカウントを作成」ボタンをクリック

5. **データベースを確認**
   - Supabaseダッシュボードで`profiles`テーブルを確認
   - `account_type`カラムに正しい値が保存されているか確認

## ✅ 結論

**はい、各登録画面で登録を行えば、account_typeを追加しながらテーブルにアカウント追加できます。**

ただし、以下の条件が必要です：
1. ✅ 登録画面でアカウントタイプを選択可能（実装済み）
2. ✅ signUp関数でaccount_typeを保存（実装済み）
3. ⚠️ **データベースにaccount_typeカラムが存在する必要がある**（マイグレーションが必要）




