'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Search,
  Megaphone,
  FileEdit,
  Users,
  CheckCircle,
  XCircle,
  Package,
  Percent,
  Calendar,
  Building2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { getAdminCampaigns, getAdminCampaignStats } from '@/lib/actions/admin';
import { toast } from 'sonner';

// Types

interface CampaignProduct {
  id: string;
  campaignPrice: number;
  product: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    price: number | null;
  };
}

interface CampaignParticipation {
  id: string;
  creatorId: string;
  status: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  status: string;
  type: string;
  startAt: string | Date | null;
  endAt: string | Date | null;
  commissionRate: number;
  totalStock: number | null;
  soldCount: number;
  targetParticipants: number | null;
  createdAt: string | Date;
  brand: { id: string; companyName: string };
  products: CampaignProduct[];
  participations: CampaignParticipation[];
}

// Helpers

function getDDay(endAt: string | Date | null): string | null {
  if (!endAt) return null;
  const end = new Date(endAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

function formatDate(d: string | Date | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-100 text-gray-700' },
  RECRUITING: { label: '모집중', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: '진행중', color: 'bg-green-100 text-green-700' },
  ENDED: { label: '종료', color: 'bg-red-100 text-red-700' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  GONGGU: { label: '공구', color: 'bg-purple-100 text-purple-700' },
  ALWAYS: { label: '상시', color: 'bg-amber-100 text-amber-700' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return <Badge className={`${cfg.color} border-0 font-medium`}>{cfg.label}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  return <Badge className={`${cfg.color} border-0 font-medium`}>{cfg.label}</Badge>;
}

// Main page

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({
    DRAFT: 0,
    RECRUITING: 0,
    ACTIVE: 0,
    ENDED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [campaignData, statsData] = await Promise.all([
        getAdminCampaigns({ status: statusFilter, type: typeFilter, search }),
        getAdminCampaignStats(),
      ]);
      setCampaigns(campaignData as Campaign[]);
      setStats(statsData);
    } catch (err) {
      console.error('Error:', err);
      toast.error('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function openSheet(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setSheetOpen(true);
  }

  const approvedCount = (c: Campaign) =>
    c.participations.filter((p) => p.status === 'APPROVED').length;

  const statCards = [
    { key: 'DRAFT', label: '작성중', icon: FileEdit, color: 'text-gray-500' },
    { key: 'RECRUITING', label: '모집중', icon: Users, color: 'text-blue-500' },
    { key: 'ACTIVE', label: '진행중', icon: CheckCircle, color: 'text-green-500' },
    { key: 'ENDED', label: '종료', icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          캠페인 관리
        </h1>
        <p className="text-sm text-gray-500 mt-1">전체 캠페인 현황을 확인하고 관리합니다</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((sc) => {
          const Icon = sc.icon;
          const active = statusFilter === sc.key;
          return (
            <Card
              key={sc.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                active ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === sc.key ? 'all' : sc.key)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{sc.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {stats[sc.key] ?? 0}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${sc.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="캠페인명 / 브랜드명 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="타입" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 타입</SelectItem>
            <SelectItem value="GONGGU">공구</SelectItem>
            <SelectItem value="ALWAYS">상시</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Megaphone className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">캠페인이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const dday = getDDay(c.endAt);
            const approved = approvedCount(c);
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => openSheet(c)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2">
                      {c.title}
                    </CardTitle>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{c.brand.companyName}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Period + D-day */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(c.startAt)} ~ {formatDate(c.endAt)}
                    </span>
                    {dday && (c.status === 'ACTIVE' || c.status === 'RECRUITING') && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          dday === '종료' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'
                        }`}
                      >
                        {dday}
                      </Badge>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5 text-gray-400" />
                      <span>{(c.commissionRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      <span>{approved}명</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                      <span>{c.products.length}개</span>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div>
                    <TypeBadge type={c.type} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          {selectedCampaign && (
            <CampaignDetail campaign={selectedCampaign} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Sheet detail component

function CampaignDetail({ campaign: c }: { campaign: Campaign }) {
  const approved = c.participations.filter((p) => p.status === 'APPROVED').length;
  const pending = c.participations.filter((p) => p.status === 'PENDING').length;
  const dday = getDDay(c.endAt);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-lg">{c.title}</SheetTitle>
        <SheetDescription className="sr-only">캠페인 상세 정보</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Status & Type */}
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          <TypeBadge type={c.type} />
          {dday && (c.status === 'ACTIVE' || c.status === 'RECRUITING') && (
            <Badge
              variant="outline"
              className={`${
                dday === '종료' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'
              }`}
            >
              {dday}
            </Badge>
          )}
        </div>

        {/* Description */}
        {c.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">설명</h4>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">{c.description}</p>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem
            icon={<Building2 className="h-4 w-4" />}
            label="브랜드"
            value={c.brand.companyName}
          />
          <InfoItem
            icon={<Calendar className="h-4 w-4" />}
            label="기간"
            value={`${formatDate(c.startAt)} ~ ${formatDate(c.endAt)}`}
          />
          <InfoItem
            icon={<Percent className="h-4 w-4" />}
            label="수수료율"
            value={`${(c.commissionRate * 100).toFixed(0)}%`}
          />
          <InfoItem
            icon={<Users className="h-4 w-4" />}
            label="참여 크리에이터"
            value={`승인 ${approved}명 / 대기 ${pending}명`}
          />
        </div>

        {/* Stock Info */}
        {c.totalStock !== null && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">재고 현황</h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                총 재고: <span className="font-medium text-gray-900">{c.totalStock.toLocaleString()}개</span>
              </span>
              <span className="text-gray-500">
                판매: <span className="font-medium text-gray-900">{c.soldCount.toLocaleString()}개</span>
              </span>
              <span className="text-gray-500">
                잔여:{' '}
                <span className="font-medium text-gray-900">
                  {(c.totalStock - c.soldCount).toLocaleString()}개
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Products */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            상품 목록 ({c.products.length}개)
          </h4>
          <div className="space-y-2">
            {c.products.map((cp) => (
              <div
                key={cp.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
              >
                {cp.product.thumbnailUrl ? (
                  <img
                    src={cp.product.thumbnailUrl}
                    alt={cp.product.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {cp.product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">
                      {cp.campaignPrice.toLocaleString()}원
                    </span>
                    {cp.product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {cp.product.price.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {c.products.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">등록된 상품이 없습니다</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-gray-50">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
