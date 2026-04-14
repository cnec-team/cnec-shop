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
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

function formatAmt(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (v >= 10000) return `${Math.round(v / 10000)}만`;
  return v.toLocaleString('ko-KR');
}

function fmtDate(date: string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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

  if (!data) return <p className="text-center text-muted-foreground py-8">데이터를 불러올 수 없습니다</p>;

  const daily = data.dailySales.map(d => ({ ...d, label: fmtDate(d.date) }));
  const hasData = data.dailySales.some(d => d.sales > 0 || d.orders > 0);
  const periodLabel = period === '7d' ? '7일' : period === '30d' ? '30일' : '90일';
  const pieData = [
    { name: '공구', value: data.campaignTypeSales.gonggu },
    { name: '상시', value: data.campaignTypeSales.always },
  ].filter(d => d.value > 0);

  const EmptyState = () => <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">아직 데이터가 없습니다</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">매출 추이</CardTitle><Badge variant="outline" className="text-xs">{periodLabel}</Badge></div></CardHeader>
        <CardContent>
          {!hasData ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatAmt(Number(v))} width={60} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']} />
                <Line type="monotone" dataKey="sales" stroke="#1A73E8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">주문 수 추이</CardTitle><Badge variant="outline" className="text-xs">{periodLabel}</Badge></div></CardHeader>
        <CardContent>
          {!hasData ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`${v}건`, '주문']} />
                <Bar dataKey="orders" fill="#1A73E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">브랜드별 매출 TOP 5</CardTitle></CardHeader>
        <CardContent>
          {data.topBrands.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topBrands} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatAmt(Number(v))} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']} />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]}>{data.topBrands.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">크리에이터별 매출 TOP 5</CardTitle></CardHeader>
        <CardContent>
          {data.topCreators.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topCreators} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => formatAmt(Number(v))} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`, '매출']} />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]}>{data.topCreators.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">상품별 판매 TOP 5</CardTitle></CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? <EmptyState /> : (
            <Table>
              <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>상품명</TableHead><TableHead className="text-right">수량</TableHead><TableHead className="text-right">매출</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.topProducts.map((p, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{i + 1}</TableCell><TableCell className="text-sm truncate max-w-[200px]">{p.name}</TableCell><TableCell className="text-right text-sm">{p.quantity.toLocaleString()}개</TableCell><TableCell className="text-right text-sm font-medium">{formatAmt(p.sales)}원</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">공구 vs 상시 매출</CardTitle></CardHeader>
        <CardContent>
          {pieData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${Math.round((percent || 0) * 100)}%`}>
                  <Cell fill="#9334E6" /><Cell fill="#FBBC04" />
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}원`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
