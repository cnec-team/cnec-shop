'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getBrandCampaignById,
  updateCampaignStatus,
  handleParticipationAction,
} from '@/lib/actions/brand';
import { CAMPAIGN_STATUS_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Info, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { CNEC_COMMISSION_RATE } from '@/lib/constants';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'RECRUITING':
      return 'secondary';
    case 'PAUSED':
      return 'outline';
    case 'ENDED':
      return 'destructive';
    default:
      return 'outline';
  }
}

interface CampaignDetail {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  recruitmentType: string;
  commissionRate: number | string;
  soldCount: number;
  totalStock: number | null;
  targetParticipants: number | null;
  conditions: string | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  products: Array<{
    id: string;
    productId: string;
    campaignPrice: number | string;
    perCreatorLimit: number | null;
    product: { id: string; name: string | null; salePrice: number | string | null; imageUrl: string | null } | null;
  }>;
  participations: Array<{
    id: string;
    creatorId: string;
    status: string;
    message: string | null;
    appliedAt: string;
    approvedAt: string | null;
    creator: {
      id: string;
      shopId: string | null;
      displayName: string | null;
      profileImageUrl: string | null;
      instagramHandle: string | null;
      youtubeHandle: string | null;
      tiktokHandle: string | null;
      skinType: string | null;
      skinConcerns: string[];
      bio: string | null;
    } | null;
  }>;
  orderCount: number;
  totalGMV: number;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [processingParticipation, setProcessingParticipation] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getBrandCampaignById(campaignId);
      if (!data) {
        setError('캠페인을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setCampaign(data as any);
    } catch {
      setError('캠페인을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [campaignId]);

  async function handleStatusChange(newStatus: string) {
    setUpdatingStatus(true);
    try {
      await updateCampaignStatus(campaignId, newStatus);
      await load();
      toast.success('캠페인 상태가 변경되었습니다');
    } catch (err: any) {
      setError(err.message || '상태 변경에 실패했습니다.');
      toast.error(err?.message || '상태 변경에 실패했습니다');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleParticipation(participationId: string, action: 'APPROVED' | 'REJECTED') {
    setProcessingParticipation(participationId);
    try {
      await handleParticipationAction(participationId, action);
      await load();
      toast.success(
        action === 'APPROVED' ? '참여를 승인했습니다' : '참여를 거절했습니다'
      );
    } catch {
      setError('참여 처리에 실패했습니다.');
      toast.error('참여 처리에 실패했습니다');
    } finally {
      setProcessingParticipation(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          뒤로
        </Button>
      </div>
    );
  }

  if (!campaign) return null;

  const pendingParticipations = campaign.participations.filter(
    (p) => p.status === 'PENDING'
  );
  const approvedParticipations = campaign.participations.filter(
    (p) => p.status === 'APPROVED'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <Badge variant={getStatusVariant(campaign.status)}>
              {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
            </Badge>
            <Badge variant="outline">
              {campaign.type === 'GONGGU' ? '공구' : '상시'}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams({ duplicate: campaign.id });
              router.push(`../campaigns/new?${params.toString()}`);
            }}
          >
            <Copy className="h-4 w-4 mr-1" />
            복제
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            뒤로
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인 상태 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">현재 상태:</span>
            <Badge variant={getStatusVariant(campaign.status)} className="text-sm">
              {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
            </Badge>
            <span className="text-muted-foreground">→</span>

            {campaign.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('RECRUITING')}
                >
                  {updatingStatus ? '처리 중...' : '모집 시작'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('ENDED')}
                >
                  삭제
                </Button>
              </>
            )}
            {campaign.status === 'RECRUITING' && (
              <>
                <Button
                  size="sm"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('ACTIVE')}
                >
                  {updatingStatus ? '처리 중...' : '캠페인 시작'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('PAUSED')}
                >
                  일시중단
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updatingStatus}
                  onClick={() => {
                    if (confirm('캠페인을 종료하시겠습니까? 종료 후에는 되돌릴 수 없습니다.')) {
                      handleStatusChange('ENDED');
                    }
                  }}
                >
                  종료
                </Button>
              </>
            )}
            {campaign.status === 'ACTIVE' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('PAUSED')}
                >
                  {updatingStatus ? '처리 중...' : '일시중단'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updatingStatus}
                  onClick={() => {
                    if (confirm('캠페인을 종료하시겠습니까? 종료 후에는 되돌릴 수 없습니다.')) {
                      handleStatusChange('ENDED');
                    }
                  }}
                >
                  종료
                </Button>
              </>
            )}
            {campaign.status === 'PAUSED' && (
              <>
                <Button
                  size="sm"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('RECRUITING')}
                >
                  {updatingStatus ? '처리 중...' : '모집 재개'}
                </Button>
                <Button
                  size="sm"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('ACTIVE')}
                >
                  캠페인 재개
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updatingStatus}
                  onClick={() => {
                    if (confirm('캠페인을 종료하시겠습니까? 종료 후에는 되돌릴 수 없습니다.')) {
                      handleStatusChange('ENDED');
                    }
                  }}
                >
                  종료
                </Button>
              </>
            )}
            {campaign.status === 'ENDED' && (
              <span className="text-sm text-muted-foreground">종료된 캠페인입니다.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{campaign.orderCount}</div>
            <p className="text-sm text-muted-foreground">주문 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(campaign.totalGMV)}</div>
            <p className="text-sm text-muted-foreground">총 매출 (GMV)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{campaign.soldCount}</div>
            <p className="text-sm text-muted-foreground">판매 수량</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{approvedParticipations.length}</div>
            <p className="text-sm text-muted-foreground">참여 크리에이터</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">크리에이터 수익률</span>
              <p className="font-medium">{Number(campaign.commissionRate) * 100}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">모집 방식</span>
              <p className="font-medium">
                {campaign.recruitmentType === 'OPEN' ? '자동 승인' : '승인제'}
              </p>
            </div>
            {campaign.totalStock && (
              <div>
                <span className="text-muted-foreground">총 물량</span>
                <p className="font-medium">{campaign.totalStock.toLocaleString('ko-KR')}개</p>
              </div>
            )}
            {campaign.targetParticipants && (
              <div>
                <span className="text-muted-foreground">목표 참여자</span>
                <p className="font-medium">{campaign.targetParticipants}명</p>
              </div>
            )}
            {campaign.startAt && (
              <div>
                <span className="text-muted-foreground">시작일</span>
                <p className="font-medium">{formatDate(campaign.startAt)}</p>
              </div>
            )}
            {campaign.endAt && (
              <div>
                <span className="text-muted-foreground">종료일</span>
                <p className="font-medium">{formatDate(campaign.endAt)}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">생성일</span>
              <p className="font-medium">{formatDate(campaign.createdAt)}</p>
            </div>
          </div>
          {campaign.conditions && (
            <>
              <Separator className="my-4" />
              <div>
                <span className="text-sm text-muted-foreground">참여 조건</span>
                <p className="mt-1 text-sm whitespace-pre-wrap">{campaign.conditions}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fee Summary */}
      {(() => {
        const commRate = Number(campaign.commissionRate);
        const commPct = Math.round(commRate * 100);
        const cnecPct = Math.round(CNEC_COMMISSION_RATE * 100);
        const firstProduct = campaign.products[0];
        const productPrice = firstProduct ? Number(firstProduct.campaignPrice) : 0;
        if (productPrice <= 0) return null;
        const creatorFee = Math.round(productPrice * commRate);
        const cnecFee = Math.round(productPrice * CNEC_COMMISSION_RATE);
        const brandNet = productPrice - creatorFee - cnecFee;
        const brandPct = Math.round((brandNet / productPrice) * 100);
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>수수료 요약</CardTitle>
              <CardDescription>상품 1개 판매 기준</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">크리에이터 수수료 {commPct}%</span>
                  <span className="font-semibold">{formatCurrency(creatorFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">크넥 수수료 {cnecPct}%</span>
                    <span className="text-xs text-muted-foreground ml-1">(결제 수수료 포함)</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(cnecFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold">브랜드 정산 예상 {brandPct}%</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(brandNet)}</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 mt-4 pt-3 border-t">
                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  크넥 수수료 {cnecPct}%에 PG 결제 수수료가 포함되어 있어요. 추가 비용은 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>
            포함 상품{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({campaign.products.length}개)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>상품명</TableHead>
                <TableHead className="text-right">캠페인가</TableHead>
                <TableHead className="text-right">크리에이터당 한도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.products.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell className="font-medium">
                    {cp.product?.name ?? '상품'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(cp.campaignPrice))}
                  </TableCell>
                  <TableCell className="text-right">
                    {cp.perCreatorLimit ? `${cp.perCreatorLimit}개` : '제한 없음'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Participations */}
      {pendingParticipations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              승인 대기{' '}
              <Badge variant="secondary">{pendingParticipations.length}</Badge>
            </CardTitle>
            <CardDescription>승인제 캠페인의 참여 신청을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터</TableHead>
                  <TableHead>SNS</TableHead>
                  <TableHead>뷰티 프로필</TableHead>
                  <TableHead>메시지</TableHead>
                  <TableHead>신청일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingParticipations.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {p.creator?.profileImageUrl && (
                            <AvatarImage src={p.creator.profileImageUrl} alt={p.creator.displayName ?? ''} />
                          )}
                          <AvatarFallback className="text-xs">
                            {(p.creator?.displayName ?? p.creatorId.slice(0, 2)).slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {p.creator?.displayName ?? p.creatorId.slice(0, 8)}
                          </p>
                          {p.creator?.shopId && (
                            <p className="text-xs text-muted-foreground">@{p.creator.shopId}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {p.creator?.instagramHandle && (
                          <a
                            href={`https://instagram.com/${p.creator.instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Badge variant="outline" className="text-xs">
                              IG @{p.creator.instagramHandle}
                            </Badge>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {p.creator?.youtubeHandle && (
                          <Badge variant="outline" className="text-xs">
                            YT @{p.creator.youtubeHandle}
                          </Badge>
                        )}
                        {p.creator?.tiktokHandle && (
                          <Badge variant="outline" className="text-xs">
                            TT @{p.creator.tiktokHandle}
                          </Badge>
                        )}
                        {!p.creator?.instagramHandle && !p.creator?.youtubeHandle && !p.creator?.tiktokHandle && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.creator?.skinType && (
                          <Badge variant="outline" className="text-xs">
                            {p.creator.skinType}
                          </Badge>
                        )}
                        {p.creator?.skinConcerns?.map((concern) => (
                          <Badge key={concern} variant="outline" className="text-xs">
                            {concern}
                          </Badge>
                        ))}
                        {!p.creator?.skinType && (!p.creator?.skinConcerns || p.creator.skinConcerns.length === 0) && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {p.message || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(p.appliedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          disabled={processingParticipation === p.id}
                          onClick={() => handleParticipation(p.id, 'APPROVED')}
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingParticipation === p.id}
                          onClick={() => handleParticipation(p.id, 'REJECTED')}
                        >
                          거절
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved Creators */}
      {approvedParticipations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              참여 크리에이터{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({approvedParticipations.length}명)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터</TableHead>
                  <TableHead>SNS</TableHead>
                  <TableHead>뷰티 프로필</TableHead>
                  <TableHead>승인일</TableHead>
                  <TableHead>샵</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedParticipations.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {p.creator?.profileImageUrl && (
                            <AvatarImage src={p.creator.profileImageUrl} alt={p.creator.displayName ?? ''} />
                          )}
                          <AvatarFallback className="text-xs">
                            {(p.creator?.displayName ?? p.creatorId.slice(0, 2)).slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {p.creator?.displayName ?? p.creatorId.slice(0, 8)}
                          </p>
                          {p.creator?.shopId && (
                            <p className="text-xs text-muted-foreground">@{p.creator.shopId}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.creator?.instagramHandle && (
                          <a
                            href={`https://instagram.com/${p.creator.instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1"
                          >
                            <Badge variant="outline" className="text-xs">
                              IG @{p.creator.instagramHandle}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        )}
                        {p.creator?.youtubeHandle && (
                          <Badge variant="outline" className="text-xs">YT @{p.creator.youtubeHandle}</Badge>
                        )}
                        {p.creator?.tiktokHandle && (
                          <Badge variant="outline" className="text-xs">TT @{p.creator.tiktokHandle}</Badge>
                        )}
                        {!p.creator?.instagramHandle && !p.creator?.youtubeHandle && !p.creator?.tiktokHandle && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.creator?.skinType && (
                          <Badge variant="outline" className="text-xs">{p.creator.skinType}</Badge>
                        )}
                        {p.creator?.skinConcerns?.map((concern) => (
                          <Badge key={concern} variant="outline" className="text-xs">{concern}</Badge>
                        ))}
                        {!p.creator?.skinType && (!p.creator?.skinConcerns || p.creator.skinConcerns.length === 0) && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.approvedAt ? formatDate(p.approvedAt) : '-'}
                    </TableCell>
                    <TableCell>
                      {p.creator?.shopId ? (
                        <a
                          href={`/shop/${p.creator.shopId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          샵 보기
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
