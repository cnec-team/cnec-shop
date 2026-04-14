'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import { getAdminDashboardCharts } from '@/lib/actions/admin';

type Period = '7d' | '30d' | '90d';

interface ChartData {
  dailySales: { date: string; sales: number; orders: number }[];
  dailySignups: { date: string; brand: number; creator: number; buyer: number }[];
  topBrands: { name: string; sales: number }[];
  topCreators: { name: string; sales: number }[];
  topProducts: { name: string; quantity: number; sales: number }[];
  campaignTypeSales: { gonggu: number; always: number };
  comparison: { prevGMV: number; prevOrderCount: number; currentGMV: number; currentOrderCount: number };
}

const COLORS = ['#1A73E8', '#34A853', '#EA4335', '#FBBC04', '#9334E6'];

function formatKRW(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
  return v.toLocaleString('ko-KR');
}

function formatDateLabel(date: string, period: Period): string {
  const d = new Date(date);
  if (period === '90d') return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{typeof p.value === 'number' && p.name?.includes('매출') ? `${formatKRW(p.value)}원` : p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts({ period }: { period: Period }) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminDashboardCharts(period)
      .then(d => setData(d as ChartData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-[250px] w-full rounded-lg" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-muted-foreground py-8">데이터를 불러올 수 없습니다</p>;
  }

  const chartDailySales = data.dailySales.map(d => ({
    ...d, label: formatDateLabel(d.date, period),
  }));

  const pieData = [
    { name: '공구', value: data.campaignTypeSales.gonggu },
    { name: '상시', value: data.campaignTypeSales.always },
  ].filter(d => d.value > 0);

  const hasData = data.dailySales.some(d => d.sales > 0 || d.orders > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Sales Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">매출 추이</CardTitle>
            <Badge variant="outline" className="text-xs">{period === '7d' ? '7일' : period === '30d' ? '30일' : '90일'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartDailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatKRW(v)} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="sales" name="매출" stroke="#1A73E8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Orders Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">주문 수 추이</CardTitle>
            <Badge variant="outline" className="text-xs">{period === '7d' ? '7일' : period === '30d' ? '30일' : '90일'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartDailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="주문 수" fill="#1A73E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 3: Brand TOP 5 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">브랜드별 매출 TOP 5</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topBrands.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topBrands} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatKRW(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" name="매출" radius={[0, 4, 4, 0]}>
                  {data.topBrands.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 4: Creator TOP 5 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">크리에이터별 매출 TOP 5</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topCreators.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topCreators} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatKRW(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" name="매출" radius={[0, 4, 4, 0]}>
                  {data.topCreators.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 5: Product TOP 5 Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">상품별 판매 TOP 5</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead className="text-right">판매 수량</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">{p.name}</TableCell>
                    <TableCell className="text-right text-sm">{p.quantity.toLocaleString()}개</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatKRW(p.sales)}원</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chart 6: Campaign Type Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">공구 vs 상시 매출</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                  <Cell fill="#9334E6" />
                  <Cell fill="#FBBC04" />
                </Pie>
                <Tooltip formatter={(value: number) => `${formatKRW(value)}원`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
