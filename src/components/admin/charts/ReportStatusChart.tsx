'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getReportStatusData } from '@/lib/admin-charts'

interface DataPoint {
  status: string
  label: string
  count: number
  color: string
}

export default function ReportStatusChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const result = await getReportStatusData()
      setData(result)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">通報ステータス</h3>
      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">読込中...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
            />
            <Bar dataKey="count" name="件数" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
