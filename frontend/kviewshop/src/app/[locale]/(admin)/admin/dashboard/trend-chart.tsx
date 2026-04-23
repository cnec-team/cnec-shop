'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getAdminWeeklyTrend } from '@/lib/actions/admin'

type TrendPoint = {
  date: string
  dateLabel: string
  gmv: number
  orders: number
}

function formatKrwShort(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`
  if (value >= 10_000) return `${Math.floor(value / 10_000)}만`
  return value.toLocaleString()
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-stone-500">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm tabular-nums">
          <span className="text-stone-500">
            {p.dataKey === 'gmv' ? '매출' : '주문'}:{' '}
          </span>
          <span className="font-semibold text-stone-900">
            {p.dataKey === 'gmv' ? `₩${p.value.toLocaleString()}` : `${p.value}건`}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function TrendChart({ initialData }: { initialData: TrendPoint[] }) {
  const [days, setDays] = useState<7 | 30>(7)
  const [data, setData] = useState<TrendPoint[]>(initialData)
  const [loading, setLoading] = useState(false)

  async function handleToggle(newDays: 7 | 30) {
    if (newDays === days) return
    setDays(newDays)
    setLoading(true)
    try {
      const result = await getAdminWeeklyTrend(newDays)
      setData(result)
    } catch {
      // 실패 시 기존 데이터 유지
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">최근 매출 추이</h3>
        <div className="flex gap-1 rounded-lg bg-stone-100 p-0.5">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => handleToggle(d)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>
      <div className={`mt-4 ${loading ? 'opacity-50' : ''}`} style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#a8a29e' }}
              tickLine={false}
              axisLine={false}
              interval={days === 30 ? 4 : 0}
            />
            <YAxis
              yAxisId="gmv"
              orientation="left"
              tick={{ fontSize: 11, fill: '#a8a29e' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatKrwShort}
              width={55}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 11, fill: '#a8a29e' }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              formatter={(value: string) => (
                <span className="text-xs text-stone-500">
                  {value === 'gmv' ? '매출' : '주문'}
                </span>
              )}
            />
            <Bar
              yAxisId="gmv"
              dataKey="gmv"
              fill="#0ea5e9"
              radius={[4, 4, 0, 0]}
              barSize={days === 30 ? 8 : 24}
              opacity={0.85}
            />
            <Line
              yAxisId="orders"
              dataKey="orders"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f97316' }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
