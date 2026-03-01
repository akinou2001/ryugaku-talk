'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getUserTypeDistribution } from '@/lib/admin-charts'

interface DataPoint {
  name: string
  value: number
  color: string
}

export default function UserTypeDistribution() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getUserTypeDistribution()
      setData(result)
      setLoading(false)
    }
    load()
  }, [])

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">ユーザー種別分布</h3>
      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">読込中...</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
