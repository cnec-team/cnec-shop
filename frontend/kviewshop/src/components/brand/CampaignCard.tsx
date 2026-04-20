'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, Image as ImageIcon, Info, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateDDay } from '@/lib/utils/date';

export type CampaignCardStatus = 'active' | 'draft' | 'ended';

export interface CampaignCardProduct {
  id: string;
  name: string | null;
  images?: string[];
}

export interface CampaignCardData {
  id: string;
  title: string;
  status: string;
  recruitmentType: string;
  commissionRate: number | string;
  soldCount: number;
  totalStock: number | null;
  startAt: string | null;
  endAt: string | null;
  revenue?: number;
  revenueChangePercent?: number | null;
  products: CampaignCardProduct[];
}

function getStatusBucket(status: string): CampaignCardStatus {
  if (status === 'DRAFT') return 'draft';
  if (status === 'ENDED') return 'ended';
  return 'active';
}

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  if (startAt && endAt) return `${fmt(startAt)} - ${fmt(endAt)}`;
  if (startAt) return `${fmt(startAt)} 시작`;
  if (endAt) return `${fmt(endAt)} 마감`;
  return '기간 미정';
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

interface CampaignCardProps {
  campaign: CampaignCardData;
  basePath: string;
  onContinueDraft?: (id: string) => void;
}

export function CampaignCard({ campaign, basePath, onContinueDraft }: CampaignCardProps) {
  const bucket = getStatusBucket(campaign.status);
  const dDays = calculateDDay(campaign.endAt);
  const dDayLabel =
    bucket === 'active' && dDays > 0 ? `${dDays}일 남음` : bucket === 'active' && dDays === 0 ? 'D-Day' : null;
  const commissionRate = Math.round(Number(campaign.commissionRate) * 100);
  const totalStock = campaign.totalStock ?? 0;
  const soldCount = campaign.soldCount ?? 0;
  const progress = totalStock > 0 ? Math.min((soldCount / totalStock) * 100, 100) : 0;
  const isComplete = progress >= 100;

  const thumbnail = campaign.products[0]?.images?.[0] ?? null;
  const detailHref = `${basePath}/${campaign.id}`;

  return (
    <article
      className={cn(
        'group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6',
        bucket === 'ended' && 'opacity-90',
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Thumbnail */}
        <div className="relative shrink-0 self-center sm:self-start">
          <div
            className={cn(
              'relative h-[120px] w-[120px] overflow-hidden rounded-2xl bg-gray-100 sm:h-[140px] sm:w-[140px]',
              bucket === 'ended' && 'grayscale',
            )}
          >
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={campaign.title}
                fill
                sizes="140px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            {dDayLabel ? (
              <span className="absolute left-2 top-2 rounded-full bg-gray-900/85 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                {dDayLabel}
              </span>
            ) : null}
            {bucket === 'ended' ? (
              <span className="absolute left-2 top-2 rounded-full bg-gray-900/85 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                종료됨
              </span>
            ) : null}
          </div>
        </div>

        {/* Center content */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                'inline-block h-2 w-2 rounded-full',
                bucket === 'active' && 'bg-blue-500',
                bucket === 'draft' && 'bg-gray-300',
                bucket === 'ended' && 'bg-gray-300',
              )}
            />
            <span
              className={cn(
                bucket === 'active' && 'text-blue-600',
                bucket !== 'active' && 'text-gray-500',
              )}
            >
              {bucket === 'active' && '진행 중'}
              {bucket === 'draft' && '작성 중'}
              {bucket === 'ended' && '종료'}
            </span>
          </div>

          <Link href={detailHref} className="group/title">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover/title:text-gray-700">
              {campaign.title || '제목 없는 캠페인'}
            </h3>
          </Link>

          <p className="text-sm text-gray-500">
            {formatPeriod(campaign.startAt, campaign.endAt)}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
              <Package className="h-3 w-3" />
              상품 {campaign.products.length}개
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              판매 수수료 {commissionRate}%
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
              {campaign.recruitmentType === 'OPEN' ? '자동승인' : '승인제'}
            </span>
          </div>
        </div>

        {/* Right block */}
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-[260px]">
          {bucket === 'draft' ? (
            <DraftSidebar campaignId={campaign.id} basePath={basePath} onContinue={onContinueDraft} />
          ) : (
            <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {bucket === 'ended' ? '최종 매출' : '누적 매출'}
                </span>
                {bucket === 'active' &&
                typeof campaign.revenueChangePercent === 'number' &&
                campaign.revenueChangePercent !== 0 ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                      campaign.revenueChangePercent > 0
                        ? 'bg-red-50 text-red-500'
                        : 'bg-blue-50 text-blue-500',
                    )}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {campaign.revenueChangePercent > 0 ? '+' : ''}
                    {campaign.revenueChangePercent}%
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-2xl font-bold text-gray-900 tabular-nums"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatNumber(campaign.revenue ?? 0)}
                </span>
                <span className="text-base font-medium text-gray-400">원</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {bucket === 'ended' ? '최종 달성률' : '판매 달성률'}
                  </span>
                  <span className="font-semibold text-blue-600 tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isComplete
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-blue-500',
                    )}
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
                <p
                  className="mt-1 text-right text-xs text-gray-400 tabular-nums"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatNumber(soldCount)} / {formatNumber(totalStock)}개
                </p>
              </div>

              <div className="mt-1 flex gap-2">
                <Link
                  href={detailHref}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  상세 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={detailHref}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  {bucket === 'ended' ? '리포트 보기' : '성과 리포트'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function DraftSidebar({
  campaignId,
  basePath,
  onContinue,
}: {
  campaignId: string;
  basePath: string;
  onContinue?: (id: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-2 rounded-2xl bg-gray-50 p-4">
      <Info className="h-5 w-5 text-gray-400" />
      <p className="text-sm font-semibold text-gray-900">작성 중인 캠페인입니다</p>
      <p className="text-xs leading-relaxed text-gray-500">
        나머지 정보를 입력하고 크리에이터를 모집해보세요
      </p>
      {onContinue ? (
        <button
          type="button"
          onClick={() => onContinue(campaignId)}
          className="mt-auto inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          이어서 작성하기
        </button>
      ) : (
        <Link
          href={`${basePath}/${campaignId}`}
          className="mt-auto inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          이어서 작성하기
        </Link>
      )}
    </div>
  );
}
