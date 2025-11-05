import { supabase } from './supabase'

// サンプルデータの挿入（開発用）
export const insertSampleData = async () => {
  try {
    // サンプル投稿データ
    const samplePosts = [
      {
        title: 'アメリカ留学の準備について質問です',
        content: '来年アメリカの大学院に留学予定です。準備で必要な書類や手続きについて教えてください。特にビザの申請について詳しく知りたいです。',
        category: 'question',
        tags: ['アメリカ', '大学院', 'ビザ', '準備'],
        university: '東京大学',
        study_abroad_destination: 'アメリカ',
        major: 'コンピュータサイエンス'
      },
      {
        title: '留学1ヶ月目の感想',
        content: 'アメリカに来て1ヶ月が経ちました。最初は英語での授業についていくのが大変でしたが、最近は少しずつ慣れてきました。寮生活も楽しく、色々な国の友達ができました。',
        category: 'diary',
        tags: ['アメリカ', '留学日記', '寮生活', '友達'],
        university: '東京大学',
        study_abroad_destination: 'アメリカ',
        major: 'コンピュータサイエンス'
      },
      {
        title: 'TOEFL対策のコツ',
        content: 'TOEFLで高得点を取るための勉強法をまとめました。特にリーディングとライティングの対策が重要です。おすすめの参考書も紹介します。',
        category: 'information',
        tags: ['TOEFL', '英語', '勉強法', '参考書'],
        university: '早稲田大学',
        study_abroad_destination: 'カナダ',
        major: '国際関係学'
      }
    ]

    console.log('サンプルデータの挿入を開始します...')
    
    // 注意: 実際のユーザーIDが必要です
    // このスクリプトは開発環境でのみ使用してください
    
    return { success: true, message: 'サンプルデータの準備が完了しました' }
  } catch (error) {
    console.error('サンプルデータの挿入に失敗しました:', error)
    return { success: false, error }
  }
}

// 開発用のヘルパー関数
export const createTestUser = async (email: string, password: string, name: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // プロフィール作成
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          name,
          contribution_score: 0,
          languages: ['日本語', '英語']
        })

      if (profileError) throw profileError

      return { success: true, user: data.user }
    }

    return { success: false, error: 'ユーザー作成に失敗しました' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


