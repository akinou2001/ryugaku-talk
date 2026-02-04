# システムアーキテクチャ図

## 全体構成

```mermaid
graph TB
    subgraph "クライアント"
        Browser[ブラウザ]
    end

    subgraph "Next.js アプリケーション"
        Frontend[Next.js Frontend<br/>React + TypeScript]
        API[API Routes<br/>/api/*]
    end

    subgraph "外部サービス"
        Supabase[(Supabase<br/>PostgreSQL + Auth + Storage)]
        Gemini[Google Gemini API<br/>AI回答生成]
    end

    Browser -->|HTTP/HTTPS| Frontend
    Frontend -->|API呼び出し| API
    API -->|認証・データ取得| Supabase
    API -->|AI回答生成| Gemini
    Frontend -->|直接接続| Supabase
```

## 主要コンポーネント

### フロントエンド
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS**

### バックエンド
- **Next.js API Routes**
  - `/api/ai/*` - AI機能
  - `/api/auth/*` - 認証
  - `/api/posts/*` - 投稿検索
  - `/api/users/*` - ユーザー推薦

### データベース・認証
- **Supabase**
  - PostgreSQL データベース
  - 認証 (Email/Password, OAuth)
  - ストレージ (画像・ファイル)

### AI機能
- **Google Generative AI (Gemini)**
  - 質問回答生成
  - 投稿検索結果の要約

## データフロー例: AI質問回答

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as Next.js Frontend
    participant API as /api/ai/route
    participant DB as Supabase DB
    participant AI as Gemini API

    User->>Frontend: 質問を入力
    Frontend->>API: POST /api/ai/route
    API->>DB: 関連投稿を検索
    DB-->>API: 投稿データ
    API->>DB: 類似ユーザーを検索
    DB-->>API: ユーザーデータ
    API->>AI: 質問 + コンテキスト送信
    AI-->>API: AI回答
    API-->>Frontend: 回答 + 引用情報
    Frontend-->>User: 結果表示
```





