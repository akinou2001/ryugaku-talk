# ryugaku-talk


## ディレクトリ構成
my-matching-app/
├── public/                  # 画像・ロゴ・静的ファイル
│   └── logo.png
├── src/
│   ├── app/                 # Next.js App Router 用（pages/ を使う場合は pages/ に変更）
│   │   ├── layout.tsx
│   │   ├── page.tsx        # トップページ
│   │   ├── login/          # ログインページ
│   │   ├── dashboard/      # メンター一覧・マイページ
│   │   └── request/        # 相談申請フォーム
│   ├── components/         # 再利用可能なUIコンポーネント
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MentorCard.tsx
│   ├── lib/                # 外部サービスとの連携やユーティリティ
│   │   ├── firebase.ts     # Firebase設定（Supabaseの場合は supabase.ts）
│   │   └── auth.ts         # 認証関連のラッパー
│   ├── types/              # 型定義（User, Mentor, Requestなど）
│   │   └── models.ts
│   ├── styles/             # TailwindベースのCSSやglobals.css
│   │   └── globals.css
│   └── hooks/              # カスタムHooks（useAuth など）
│       └── useAuth.ts
├── .env.local              # 環境変数（Firebase APIキーなど）
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
