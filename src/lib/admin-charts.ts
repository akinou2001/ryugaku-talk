import { supabase } from './supabase'

export type Period = '7d' | '30d' | '90d'

interface TimeSeriesPoint {
  date: string
  count: number
}

interface UserTypePoint {
  name: string
  value: number
  color: string
}

interface PostActivityPoint {
  date: string
  posts: number
  comments: number
}

interface ReportStatusPoint {
  status: string
  label: string
  count: number
  color: string
}

function getDaysFromPeriod(period: Period): number {
  switch (period) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
  }
}

function getDateLabel(date: Date, period: Period): string {
  if (period === '7d') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else if (period === '30d') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  } else {
    // 90d: weekly grouping
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

function generateDateRange(period: Period): string[] {
  const days = getDaysFromPeriod(period)
  const dates: string[] = []
  const now = new Date()

  if (period === '90d') {
    // Weekly grouping for 90d
    for (let i = Math.floor(days / 7); i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      dates.push(getDateLabel(d, period))
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dates.push(getDateLabel(d, period))
    }
  }
  return dates
}

function bucketByDate(
  rows: { created_at: string }[],
  period: Period
): Map<string, number> {
  const map = new Map<string, number>()
  const days = getDaysFromPeriod(period)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  for (const row of rows) {
    const d = new Date(row.created_at)
    if (d < cutoff) continue

    let key: string
    if (period === '90d') {
      // Snap to week start (Monday)
      const dayOfWeek = d.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(d)
      monday.setDate(monday.getDate() + mondayOffset)
      key = getDateLabel(monday, period)
    } else {
      key = getDateLabel(d, period)
    }

    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

export async function getUserGrowthData(period: Period): Promise<TimeSeriesPoint[]> {
  const days = getDaysFromPeriod(period)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data) return []

  const buckets = bucketByDate(data, period)
  const dateRange = generateDateRange(period)

  return dateRange.map(date => ({
    date,
    count: buckets.get(date) || 0,
  }))
}

export async function getPostActivityData(period: Period): Promise<PostActivityPoint[]> {
  const days = getDaysFromPeriod(period)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const [postsRes, commentsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', cutoff.toISOString()),
    supabase
      .from('comments')
      .select('created_at')
      .gte('created_at', cutoff.toISOString()),
  ])

  const postBuckets = bucketByDate(postsRes.data || [], period)
  const commentBuckets = bucketByDate(commentsRes.data || [], period)
  const dateRange = generateDateRange(period)

  return dateRange.map(date => ({
    date,
    posts: postBuckets.get(date) || 0,
    comments: commentBuckets.get(date) || 0,
  }))
}

export async function getUserTypeDistribution(): Promise<UserTypePoint[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('account_type')

  if (error || !data) return []

  const counts: Record<string, number> = {}
  for (const row of data) {
    const type = row.account_type || 'individual'
    counts[type] = (counts[type] || 0) + 1
  }

  const typeConfig: Record<string, { name: string; color: string }> = {
    individual: { name: '個人', color: '#6366f1' },
    educational: { name: '教育機関', color: '#3b82f6' },
    company: { name: '企業', color: '#10b981' },
    government: { name: '政府機関', color: '#8b5cf6' },
  }

  return Object.entries(counts).map(([type, value]) => ({
    name: typeConfig[type]?.name || type,
    value,
    color: typeConfig[type]?.color || '#94a3b8',
  }))
}

export async function getReportStatusData(): Promise<ReportStatusPoint[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('status')

  if (error || !data) return []

  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.status] = (counts[row.status] || 0) + 1
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '未対応', color: '#ef4444' },
    reviewed: { label: '確認済み', color: '#f59e0b' },
    resolved: { label: '解決済み', color: '#10b981' },
  }

  return Object.entries(statusConfig).map(([status, config]) => ({
    status,
    label: config.label,
    count: counts[status] || 0,
    color: config.color,
  }))
}
