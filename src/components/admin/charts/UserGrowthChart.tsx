'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getUserGrowthData, type Period } from '@/lib/admin-charts'

export default function UserGrowthChart() {
  const [data, setData] = useState<{ date: string; count: number }[]>([])
  const [period, setPeriod] = useState<Period>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getUserGrowthData(period)
      setData(result)
      setLoading(false)
    }
    load()
  }, [period])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">ユーザー増加推移</h3>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                period === p ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p === '7d' ? '7日' : p === '30d' ? '30日' : '90日'}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">読込中...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="新規ユーザー"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#userGrowthGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
