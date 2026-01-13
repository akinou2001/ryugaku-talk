import { supabase } from './supabase'

/**
 * ファイルをSupabase Storageにアップロード
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder?: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }

  // ファイル名を生成（タイムスタンプ + 元のファイル名）
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${timestamp}_${sanitizedFileName}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  // ファイルをアップロード
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading file:', error)
    console.error('Bucket:', bucket)
    console.error('FilePath:', filePath)
    console.error('File size:', file.size)
    console.error('File type:', file.type)
    
    // より詳細なエラーメッセージ
    let errorMessage = `ファイルのアップロードに失敗しました: ${error.message}`
    if (error.message.includes('Bucket not found')) {
      errorMessage = `バケット "${bucket}" が見つかりません。Supabaseダッシュボードでバケットを作成してください。`
    } else if (error.message.includes('new row violates row-level security policy')) {
      errorMessage = `バケット "${bucket}" のRLSポリシーが正しく設定されていません。Storageのポリシーを確認してください。`
    } else if (error.message.includes('The resource already exists')) {
      errorMessage = `同じファイル名のファイルが既に存在します。`
    }
    
    throw new Error(errorMessage)
  }

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * 複数のファイルをアップロード
 */
export async function uploadFiles(
  files: File[],
  bucket: string,
  folder?: string
): Promise<Array<{ url: string; filename: string; type: string }>> {
  const uploadPromises = files.map(async (file) => {
    const url = await uploadFile(file, bucket, folder)
    return {
      url,
      filename: file.name,
      type: file.type || 'application/octet-stream'
    }
  })

  return Promise.all(uploadPromises)
}

/**
 * ファイルタイプを検証
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some(type => {
    if (type.includes('*')) {
      const baseType = type.split('/')[0]
      return file.type.startsWith(baseType)
    }
    return file.type === type
  })
}

/**
 * ファイルサイズを検証（MB単位）
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 画像ファイルかどうかを判定
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * サポートされているファイルタイプの定義
 */
export const FILE_TYPES = {
  // イベント添付ファイル
  EVENT_ATTACHMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'image/*'
  ],
  // 投稿画像
  POST_IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
}

/**
 * ファイルタイプから拡張子を取得
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * ファイルアイコンを取得
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'
  return '📎'
}




