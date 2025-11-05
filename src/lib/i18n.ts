import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ja: {
    translation: {
      // 共通
      common: {
        loading: '読み込み中...',
        error: 'エラーが発生しました',
        success: '成功しました',
        cancel: 'キャンセル',
        confirm: '確認',
        save: '保存',
        edit: '編集',
        delete: '削除',
        back: '戻る',
        next: '次へ',
        previous: '前へ',
        search: '検索',
        filter: 'フィルター',
        sort: '並び替え',
        all: 'すべて',
        none: 'なし',
        yes: 'はい',
        no: 'いいえ',
      },
      // ナビゲーション
      nav: {
        home: 'ホーム',
        board: '掲示板',
        diary: '留学日記',
        chat: 'チャット',
        profile: 'プロフィール',
        settings: '設定',
        signIn: 'ログイン',
        signUp: '新規登録',
        signOut: 'ログアウト',
      },
      // 認証
      auth: {
        signIn: 'ログイン',
        signUp: '新規登録',
        signOut: 'ログアウト',
        email: 'メールアドレス',
        password: 'パスワード',
        confirmPassword: 'パスワード（確認）',
        name: 'お名前',
        rememberMe: 'ログイン状態を保持',
        forgotPassword: 'パスワードを忘れた場合',
        agreeTerms: '利用規約およびプライバシーポリシーに同意します',
        signInWithGoogle: 'Googleでログイン',
        signUpWithGoogle: 'Googleでアカウント作成',
        alreadyHaveAccount: '既存のアカウントにログイン',
        createNewAccount: '新規アカウントを作成',
      },
      // 投稿
      post: {
        title: 'タイトル',
        content: '内容',
        category: 'カテゴリ',
        tags: 'タグ',
        university: '大学',
        studyAbroadDestination: '留学先',
        major: '専攻',
        createPost: '新規投稿',
        editPost: '投稿を編集',
        deletePost: '投稿を削除',
        like: 'いいね',
        comment: 'コメント',
        share: '共有',
        report: '通報',
        categories: {
          question: '質問',
          diary: '留学日記',
          information: '情報共有',
        },
        status: {
          resolved: '解決済み',
          pending: '未解決',
          pinned: '固定',
        },
      },
      // プロフィール
      profile: {
        name: '名前',
        email: 'メールアドレス',
        university: '大学',
        studyAbroadDestination: '留学先',
        major: '専攻',
        bio: '自己紹介',
        languages: '使用言語',
        contributionScore: '貢献度',
        posts: '投稿数',
        comments: 'コメント数',
        likes: 'いいね数',
        joinDate: '参加日',
        editProfile: 'プロフィールを編集',
        viewProfile: 'プロフィールを見る',
      },
      // メッセージ
      message: {
        send: '送信',
        reply: '返信',
        markAsRead: '既読にする',
        markAsUnread: '未読にする',
        delete: '削除',
        newMessage: '新しいメッセージ',
        noMessages: 'メッセージがありません',
        typeMessage: 'メッセージを入力...',
      },
      // エラー
      error: {
        networkError: 'ネットワークエラーが発生しました',
        authError: '認証エラーが発生しました',
        notFound: 'ページが見つかりません',
        unauthorized: 'アクセス権限がありません',
        serverError: 'サーバーエラーが発生しました',
        validationError: '入力内容に誤りがあります',
      },
      // 成功メッセージ
      success: {
        postCreated: '投稿が作成されました',
        postUpdated: '投稿が更新されました',
        postDeleted: '投稿が削除されました',
        commentAdded: 'コメントが追加されました',
        profileUpdated: 'プロフィールが更新されました',
        messageSent: 'メッセージが送信されました',
      },
    },
  },
  en: {
    translation: {
      // Common
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        all: 'All',
        none: 'None',
        yes: 'Yes',
        no: 'No',
      },
      // Navigation
      nav: {
        home: 'Home',
        board: 'Board',
        diary: 'Study Abroad Diary',
        chat: 'Chat',
        profile: 'Profile',
        settings: 'Settings',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
      },
      // Authentication
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        name: 'Name',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        agreeTerms: 'I agree to the Terms of Service and Privacy Policy',
        signInWithGoogle: 'Sign in with Google',
        signUpWithGoogle: 'Sign up with Google',
        alreadyHaveAccount: 'Already have an account?',
        createNewAccount: 'Create a new account',
      },
      // Posts
      post: {
        title: 'Title',
        content: 'Content',
        category: 'Category',
        tags: 'Tags',
        university: 'University',
        studyAbroadDestination: 'Study Abroad Destination',
        major: 'Major',
        createPost: 'Create Post',
        editPost: 'Edit Post',
        deletePost: 'Delete Post',
        like: 'Like',
        comment: 'Comment',
        share: 'Share',
        report: 'Report',
        categories: {
          question: 'Question',
          diary: 'Study Abroad Diary',
          information: 'Information',
        },
        status: {
          resolved: 'Resolved',
          pending: 'Pending',
          pinned: 'Pinned',
        },
      },
      // Profile
      profile: {
        name: 'Name',
        email: 'Email',
        university: 'University',
        studyAbroadDestination: 'Study Abroad Destination',
        major: 'Major',
        bio: 'Bio',
        languages: 'Languages',
        contributionScore: 'Contribution Score',
        posts: 'Posts',
        comments: 'Comments',
        likes: 'Likes',
        joinDate: 'Join Date',
        editProfile: 'Edit Profile',
        viewProfile: 'View Profile',
      },
      // Messages
      message: {
        send: 'Send',
        reply: 'Reply',
        markAsRead: 'Mark as Read',
        markAsUnread: 'Mark as Unread',
        delete: 'Delete',
        newMessage: 'New Message',
        noMessages: 'No messages',
        typeMessage: 'Type a message...',
      },
      // Errors
      error: {
        networkError: 'Network error occurred',
        authError: 'Authentication error occurred',
        notFound: 'Page not found',
        unauthorized: 'Unauthorized access',
        serverError: 'Server error occurred',
        validationError: 'Validation error',
      },
      // Success messages
      success: {
        postCreated: 'Post created successfully',
        postUpdated: 'Post updated successfully',
        postDeleted: 'Post deleted successfully',
        commentAdded: 'Comment added successfully',
        profileUpdated: 'Profile updated successfully',
        messageSent: 'Message sent successfully',
      },
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja',
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n


