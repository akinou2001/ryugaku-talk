# Supabase メールテンプレート文章集

RyugakuTalk（留学支援コミュニティプラットフォーム）用のメールテンプレート文章です。

## 📧 1. Confirm signup（アカウント確認メール）

### 日本語版（HTML）

```html
<h2>RyugakuTalkへようこそ！</h2>

<p>この度は、RyugakuTalkにご登録いただき、誠にありがとうございます。</p>

<p>以下のリンクをクリックして、メールアドレスを確認してください：</p>

<p><a href="{{ .ConfirmationURL }}">メールアドレスを確認する</a></p>

<p>このリンクは24時間有効です。</p>

<p>もしこのメールに心当たりがない場合は、このメールを無視していただいて構いません。</p>

<hr>
<p>RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 英語版（HTML）

```html
<h2>Welcome to RyugakuTalk!</h2>

<p>Thank you for signing up for RyugakuTalk.</p>

<p>Please click the link below to confirm your email address:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't create an account, please ignore this email.</p>

<hr>
<p>RyugakuTalk - A next-generation study abroad community platform</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 日本語版（テキスト）

```
RyugakuTalkへようこそ！

この度は、RyugakuTalkにご登録いただき、誠にありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：
{{ .ConfirmationURL }}

このリンクは24時間有効です。

もしこのメールに心当たりがない場合は、このメールを無視していただいて構いません。

---
RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
{{ .SiteURL }}
```

### 英語版（テキスト）

```
Welcome to RyugakuTalk!

Thank you for signing up for RyugakuTalk.

Please click the link below to confirm your email address:
{{ .ConfirmationURL }}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

---
RyugakuTalk - A next-generation study abroad community platform
{{ .SiteURL }}
```

---

## 🔑 2. Reset Password（パスワードリセットメール）

### 日本語版（HTML）

```html
<h2>パスワードのリセット</h2>

<p>RyugakuTalkのパスワードリセットリクエストを受け付けました。</p>

<p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>

<p><a href="{{ .ConfirmationURL }}">パスワードをリセットする</a></p>

<p>このリンクは1時間有効です。</p>

<p><strong>重要：</strong>このリクエストをしていない場合は、このメールを無視してください。あなたのアカウントは安全です。</p>

<p>パスワードのリセットをご希望でない場合は、このメールを無視していただいて構いません。</p>

<hr>
<p>RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 英語版（HTML）

```html
<h2>Reset Your Password</h2>

<p>We received a request to reset your RyugakuTalk password.</p>

<p>Please click the link below to set a new password:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>This link will expire in 1 hour.</p>

<p><strong>Important:</strong> If you didn't request this, please ignore this email. Your account is secure.</p>

<p>If you didn't request a password reset, please ignore this email.</p>

<hr>
<p>RyugakuTalk - A next-generation study abroad community platform</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 日本語版（テキスト）

```
パスワードのリセット

RyugakuTalkのパスワードリセットリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：
{{ .ConfirmationURL }}

このリンクは1時間有効です。

重要：このリクエストをしていない場合は、このメールを無視してください。あなたのアカウントは安全です。

パスワードのリセットをご希望でない場合は、このメールを無視していただいて構いません。

---
RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
{{ .SiteURL }}
```

### 英語版（テキスト）

```
Reset Your Password

We received a request to reset your RyugakuTalk password.

Please click the link below to set a new password:
{{ .ConfirmationURL }}

This link will expire in 1 hour.

Important: If you didn't request this, please ignore this email. Your account is secure.

If you didn't request a password reset, please ignore this email.

---
RyugakuTalk - A next-generation study abroad community platform
{{ .SiteURL }}
```

---

## ✨ 3. Magic Link（マジックリンクログイン）

### 日本語版（HTML）

```html
<h2>ログインリンク</h2>

<p>RyugakuTalkへのログインリクエストを受け付けました。</p>

<p>以下のリンクをクリックして、ログインしてください：</p>

<p><a href="{{ .ConfirmationURL }}">ログインする</a></p>

<p>このリンクは1時間有効です。</p>

<p><strong>重要：</strong>このログインリクエストをしていない場合は、このメールを無視してください。あなたのアカウントは安全です。</p>

<hr>
<p>RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 英語版（HTML）

```html
<h2>Login Link</h2>

<p>We received a login request for RyugakuTalk.</p>

<p>Please click the link below to log in:</p>

<p><a href="{{ .ConfirmationURL }}">Log In</a></p>

<p>This link will expire in 1 hour.</p>

<p><strong>Important:</strong> If you didn't request this, please ignore this email. Your account is secure.</p>

<hr>
<p>RyugakuTalk - A next-generation study abroad community platform</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 日本語版（テキスト）

```
ログインリンク

RyugakuTalkへのログインリクエストを受け付けました。

以下のリンクをクリックして、ログインしてください：
{{ .ConfirmationURL }}

このリンクは1時間有効です。

重要：このログインリクエストをしていない場合は、このメールを無視してください。あなたのアカウントは安全です。

---
RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
{{ .SiteURL }}
```

### 英語版（テキスト）

```
Login Link

We received a login request for RyugakuTalk.

Please click the link below to log in:
{{ .ConfirmationURL }}

This link will expire in 1 hour.

Important: If you didn't request this, please ignore this email. Your account is secure.

---
RyugakuTalk - A next-generation study abroad community platform
{{ .SiteURL }}
```

---

## 📧 4. Change Email Address（メールアドレス変更）

### 日本語版（HTML）

```html
<h2>メールアドレスの変更確認</h2>

<p>RyugakuTalkアカウントのメールアドレス変更リクエストを受け付けました。</p>

<p>新しいメールアドレス（{{ .Email }}）に変更するには、以下のリンクをクリックしてください：</p>

<p><a href="{{ .ConfirmationURL }}">メールアドレスを変更する</a></p>

<p>このリンクは24時間有効です。</p>

<p><strong>重要：</strong>このメールアドレス変更リクエストをしていない場合は、このメールを無視してください。あなたのアカウントは安全です。</p>

<p>メールアドレスの変更をご希望でない場合は、このメールを無視していただいて構いません。</p>

<hr>
<p>RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 英語版（HTML）

```html
<h2>Confirm Email Address Change</h2>

<p>We received a request to change your RyugakuTalk account email address.</p>

<p>To change your email address to {{ .Email }}, please click the link below:</p>

<p><a href="{{ .ConfirmationURL }}">Change Email Address</a></p>

<p>This link will expire in 24 hours.</p>

<p><strong>Important:</strong> If you didn't request this, please ignore this email. Your account is secure.</p>

<p>If you didn't request an email address change, please ignore this email.</p>

<hr>
<p>RyugakuTalk - A next-generation study abroad community platform</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 日本語版（テキスト）

```
メールアドレスの変更確認

RyugakuTalkアカウントのメールアドレス変更リクエストを受け付けました。

新しいメールアドレス（{{ .Email }}）に変更するには、以下のリンクをクリックしてください：
{{ .ConfirmationURL }}

このリンクは24時間有効です。

重要：このメールアドレス変更リクエストをしていない場合は、このメールを無視してください。あなたのアカウントは安全です。

メールアドレスの変更をご希望でない場合は、このメールを無視していただいて構いません。

---
RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
{{ .SiteURL }}
```

### 英語版（テキスト）

```
Confirm Email Address Change

We received a request to change your RyugakuTalk account email address.

To change your email address to {{ .Email }}, please click the link below:
{{ .ConfirmationURL }}

This link will expire in 24 hours.

Important: If you didn't request this, please ignore this email. Your account is secure.

If you didn't request an email address change, please ignore this email.

---
RyugakuTalk - A next-generation study abroad community platform
{{ .SiteURL }}
```

---

## 👥 5. Invite user（招待メール）

### 日本語版（HTML）

```html
<h2>RyugakuTalkへのご招待</h2>

<p>あなたはRyugakuTalkに招待されました！</p>

<p>RyugakuTalkは、留学中・留学希望者・関係者が質問・共有・交流できる安全なオンラインコミュニティプラットフォームです。</p>

<p>以下のリンクをクリックして、アカウントを作成してください：</p>

<p><a href="{{ .ConfirmationURL }}">アカウントを作成する</a></p>

<p>このリンクは7日間有効です。</p>

<p>RyugakuTalkで、留学に関する情報を共有し、経験者や希望者とつながりましょう。</p>

<hr>
<p>RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 英語版（HTML）

```html
<h2>You're Invited to RyugakuTalk</h2>

<p>You've been invited to join RyugakuTalk!</p>

<p>RyugakuTalk is a safe online community platform where students studying abroad, prospective students, and related parties can ask questions, share experiences, and connect with each other.</p>

<p>Please click the link below to create your account:</p>

<p><a href="{{ .ConfirmationURL }}">Create Account</a></p>

<p>This link will expire in 7 days.</p>

<p>Join RyugakuTalk to share study abroad information and connect with experienced and prospective students.</p>

<hr>
<p>RyugakuTalk - A next-generation study abroad community platform</p>
<p><a href="{{ .SiteURL }}">{{ .SiteURL }}</a></p>
```

### 日本語版（テキスト）

```
RyugakuTalkへのご招待

あなたはRyugakuTalkに招待されました！

RyugakuTalkは、留学中・留学希望者・関係者が質問・共有・交流できる安全なオンラインコミュニティプラットフォームです。

以下のリンクをクリックして、アカウントを作成してください：
{{ .ConfirmationURL }}

このリンクは7日間有効です。

RyugakuTalkで、留学に関する情報を共有し、経験者や希望者とつながりましょう。

---
RyugakuTalk - みんなの留学体験が紡ぐ、次世代の留学コミュニティプラットフォーム
{{ .SiteURL }}
```

### 英語版（テキスト）

```
You're Invited to RyugakuTalk

You've been invited to join RyugakuTalk!

RyugakuTalk is a safe online community platform where students studying abroad, prospective students, and related parties can ask questions, share experiences, and connect with each other.

Please click the link below to create your account:
{{ .ConfirmationURL }}

This link will expire in 7 days.

Join RyugakuTalk to share study abroad information and connect with experienced and prospective students.

---
RyugakuTalk - A next-generation study abroad community platform
{{ .SiteURL }}
```

---

## 📝 使用上の注意

### Supabaseでの設定方法

1. **Supabaseダッシュボードにログイン**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **プロジェクトを選択**

3. **「Authentication」→「Email Templates」を開く**

4. **テンプレートを選択**
   - Confirm signup
   - Reset Password
   - Magic Link
   - Change Email Address
   - Invite user

5. **HTMLまたはテキスト版を編集**
   - 上記のテンプレート文章をコピー＆ペースト
   - 必要に応じてカスタマイズ

6. **「Save」をクリック**

### 変数の説明

- `{{ .ConfirmationURL }}` - 確認リンクURL（必須）
- `{{ .Email }}` - ユーザーのメールアドレス
- `{{ .SiteURL }}` - サイトのURL
- `{{ .Token }}` - トークン
- `{{ .TokenHash }}` - トークンハッシュ

### カスタマイズのポイント

- ブランディングに合わせて色やスタイルを調整
- 実際のサイトURL（`{{ .SiteURL }}`）が正しく設定されているか確認
- リンクの有効期限を明記（セキュリティのため）
- セキュリティに関する注意書きを必ず含める

