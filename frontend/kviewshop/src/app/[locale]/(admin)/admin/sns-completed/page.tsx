'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Video,
  Edit,
  Trash2,
} from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import type {
  SnsCampaign,
  SnsUpload,
  SnsCountry,
  SnsPlatform,
  SnsUploadStatus,
} from '@/types/database';
import {
  SNS_COUNTRY_LABELS,
  SNS_COUNTRY_FLAGS,
  SNS_PLATFORM_LABELS,
  SNS_UPLOAD_STATUS_LABELS,
} from '@/types/database';

interface SnsCampaignWithUploads extends SnsCampaign {
  uploads: SnsUpload[];
}

const COUNTRY_OPTIONS: SnsCountry[] = ['KR', 'JP', 'US', 'TW'];
const PLATFORM_OPTIONS: SnsPlatform[] = ['youtube', 'instagram', 'tiktok'];

function getStatusBadge(status: SnsUploadStatus) {
  switch (status) {
    case 'UPLOADED':
      return <Badge className="bg-green-600 text-white">등록완료</Badge>;
    case 'VERIFIED':
      return <Badge className="bg-blue-600 text-white">확인완료</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">반려</Badge>;
    default:
      return <Badge variant="outline" className="text-orange-500 border-orange-500">미등록</Badge>;
  }
}

function getPlatformIcon(platform: SnsPlatform) {
  switch (platform) {
    case 'youtube':
      return <span className="text-red-500">▶</span>;
    case 'instagram':
      return <span className="text-pink-500">◉</span>;
    case 'tiktok':
      return <span className="text-foreground">♪</span>;
  }
}

export default function AdminSnsCompletedPage() {
  const [campaigns, setCampaigns] = useState<SnsCampaignWithUploads[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filters
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');

  // Dialog states
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<SnsCampaignWithUploads | null>(null);
  const [editingUpload, setEditingUpload] = useState<SnsUpload | null>(null);

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    country: 'KR' as SnsCountry,
    campaign_type: '기획',
    event_name: '',
    period_weeks: 4,
    start_date: '',
    end_date: '',
    description: '',
  });

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    creator_name: '',
    platform: 'youtube' as SnsPlatform,
    sns_url: '',
    video_title: '',
    notes: '',
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getClient();

      let query = supabase.from('sns_campaigns').select('*').order('created_at', { ascending: false });

      if (filterCountry !== 'all') query = query.eq('country', filterCountry);
      if (filterType !== 'all') query = query.eq('campaign_type', filterType);
      if (filterEvent !== 'all') query = query.eq('event_name', filterEvent);

      const { data: campaignsData, error: campaignError } = await query;
      if (campaignError) throw campaignError;

      const campaignIds = (campaignsData || []).map((c) => c.id);
      let uploadsData: SnsUpload[] = [];

      if (campaignIds.length > 0) {
        const { data, error: uploadsError } = await supabase
          .from('sns_uploads')
          .select('*')
          .in('sns_campaign_id', campaignIds)
          .order('creator_name', { ascending: true });
        if (uploadsError) throw uploadsError;
        uploadsData = (data || []) as SnsUpload[];
      }

      const campaignsWithUploads: SnsCampaignWithUploads[] = (campaignsData || []).map((c) => ({
        ...c,
        uploads: uploadsData.filter((u) => u.sns_campaign_id === c.id),
      })) as SnsCampaignWithUploads[];

      setCampaigns(campaignsWithUploads);
    } catch (error) {
      console.error('Error fetching SNS campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterType, filterEvent]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Get unique event names for filter
  const eventNames = [...new Set(campaigns.map((c) => c.event_name))];

  // Create campaign
  async function handleCreateCampaign() {
    try {
      const supabase = getClient();
      const { error } = await supabase.from('sns_campaigns').insert({
        country: campaignForm.country,
        campaign_type: campaignForm.campaign_type,
        event_name: campaignForm.event_name,
        period_weeks: campaignForm.period_weeks,
        start_date: campaignForm.start_date || null,
        end_date: campaignForm.end_date || null,
        description: campaignForm.description || null,
        status: 'ACTIVE',
      });

      if (error) throw error;
      setShowCampaignDialog(false);
      setCampaignForm({ country: 'KR', campaign_type: '기획', event_name: '', period_weeks: 4, start_date: '', end_date: '', description: '' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('캠페인 생성에 실패했습니다');
    }
  }

  // Delete campaign
  async function handleDeleteCampaign(id: string) {
    if (!confirm('이 캠페인과 모든 업로드 기록을 삭제하시겠습니까?')) return;
    try {
      const supabase = getClient();
      const { error } = await supabase.from('sns_campaigns').delete().eq('id', id);
      if (error) throw error;
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  }

  // Save upload (create or update)
  async function handleSaveUpload() {
    if (!selectedCampaign) return;
    try {
      const supabase = getClient();

      // Validate URL if provided
      if (uploadForm.sns_url) {
        const isValid = validateSnsUrl(uploadForm.sns_url, uploadForm.platform);
        if (!isValid) {
          alert(`유효하지 않은 ${SNS_PLATFORM_LABELS[uploadForm.platform]} URL입니다`);
          return;
        }
      }

      if (editingUpload) {
        // Update existing
        const { error } = await supabase
          .from('sns_uploads')
          .update({
            sns_url: uploadForm.sns_url || null,
            video_title: uploadForm.video_title || null,
            upload_status: uploadForm.sns_url ? 'UPLOADED' : 'PENDING',
            notes: uploadForm.notes || null,
            uploaded_at: uploadForm.sns_url ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUpload.id);
        if (error) throw error;
      } else {
        // Find or create a placeholder creator_id
        // For admin-added uploads, we need the creator to exist
        // Try to find creator by name
        const { data: creator } = await supabase
          .from('creators')
          .select('id')
          .ilike('display_name', uploadForm.creator_name)
          .maybeSingle();

        const creatorId = creator?.id;
        if (!creatorId) {
          alert('해당 이름의 크리에이터를 찾을 수 없습니다. 크리에이터를 먼저 등록해주세요.');
          return;
        }

        const { error } = await supabase.from('sns_uploads').insert({
          sns_campaign_id: selectedCampaign.id,
          creator_id: creatorId,
          creator_name: uploadForm.creator_name,
          platform: uploadForm.platform,
          sns_url: uploadForm.sns_url || null,
          video_title: uploadForm.video_title || null,
          upload_status: uploadForm.sns_url ? 'UPLOADED' : 'PENDING',
          notes: uploadForm.notes || null,
          uploaded_at: uploadForm.sns_url ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }

      setShowUploadDialog(false);
      setEditingUpload(null);
      setUploadForm({ creator_name: '', platform: 'youtube', sns_url: '', video_title: '', notes: '' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving upload:', error);
      alert('저장에 실패했습니다');
    }
  }

  // Update upload status
  async function handleUpdateStatus(upload: SnsUpload, newStatus: SnsUploadStatus) {
    try {
      const supabase = getClient();
      const updateData: Record<string, unknown> = {
        upload_status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'VERIFIED') updateData.verified_at = new Date().toISOString();

      const { error } = await supabase.from('sns_uploads').update(updateData).eq('id', upload.id);
      if (error) throw error;
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  // Delete upload
  async function handleDeleteUpload(id: string) {
    if (!confirm('이 업로드 기록을 삭제하시겠습니까?')) return;
    try {
      const supabase = getClient();
      const { error } = await supabase.from('sns_uploads').delete().eq('id', id);
      if (error) throw error;
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting upload:', error);
    }
  }

  // Open edit dialog
  function openEditUpload(upload: SnsUpload, campaign: SnsCampaignWithUploads) {
    setSelectedCampaign(campaign);
    setEditingUpload(upload);
    setUploadForm({
      creator_name: upload.creator_name,
      platform: upload.platform,
      sns_url: upload.sns_url || '',
      video_title: upload.video_title || '',
      notes: upload.notes || '',
    });
    setShowUploadDialog(true);
  }

  // Open add dialog
  function openAddUpload(campaign: SnsCampaignWithUploads) {
    setSelectedCampaign(campaign);
    setEditingUpload(null);
    setUploadForm({ creator_name: '', platform: 'youtube', sns_url: '', video_title: '', notes: '' });
    setShowUploadDialog(true);
  }

  // Stats
  const totalUploads = campaigns.reduce((sum, c) => sum + c.uploads.length, 0);
  const completedUploads = campaigns.reduce(
    (sum, c) => sum + c.uploads.filter((u) => u.upload_status === 'UPLOADED' || u.upload_status === 'VERIFIED').length,
    0
  );
  const pendingUploads = campaigns.reduce(
    (sum, c) => sum + c.uploads.filter((u) => u.upload_status === 'PENDING').length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">SNS 업로드 관리</h1>
          <p className="text-muted-foreground">크리에이터 SNS 컨텐츠 업로드 현황을 관리합니다</p>
        </div>
        <Button onClick={() => setShowCampaignDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          캠페인 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">전체 캠페인</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalUploads}</div>
            <p className="text-xs text-muted-foreground">전체 업로드</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{completedUploads}</div>
            <p className="text-xs text-muted-foreground">등록완료</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{pendingUploads}</div>
            <p className="text-xs text-muted-foreground">미등록</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">국가</Label>
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SNS_COUNTRY_FLAGS[c]} {SNS_COUNTRY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">유형</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="기획">기획</SelectItem>
                  <SelectItem value="숏폼">숏폼</SelectItem>
                  <SelectItem value="리뷰">리뷰</SelectItem>
                  <SelectItem value="라이브">라이브</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이벤트</Label>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {eventNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">크리에이터 검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="크리에이터 이름으로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Tabs */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            로딩 중...
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">등록된 SNS 캠페인이 없습니다</p>
            <Button className="mt-4" onClick={() => setShowCampaignDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 캠페인 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={campaigns[0]?.id} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent justify-start">
            {campaigns.map((campaign) => {
              const completed = campaign.uploads.filter(
                (u) => u.upload_status === 'UPLOADED' || u.upload_status === 'VERIFIED'
              ).length;
              return (
                <TabsTrigger key={campaign.id} value={campaign.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {SNS_COUNTRY_FLAGS[campaign.country]} {campaign.event_name}
                  <span className="ml-1 text-xs opacity-70">
                    ({completed}/{campaign.uploads.length})
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {campaigns.map((campaign) => {
            const filteredUploads = campaign.uploads.filter((u) =>
              search ? u.creator_name.toLowerCase().includes(search.toLowerCase()) : true
            );

            return (
              <TabsContent key={campaign.id} value={campaign.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {SNS_COUNTRY_FLAGS[campaign.country]} {campaign.event_name}
                          <Badge variant="outline">{campaign.campaign_type}</Badge>
                          <Badge variant="outline">{campaign.period_weeks}주</Badge>
                        </CardTitle>
                        <CardDescription>
                          {SNS_COUNTRY_LABELS[campaign.country]} / {campaign.campaign_type} / {campaign.event_name} / {campaign.period_weeks}주
                          {campaign.start_date && ` / ${campaign.start_date} ~ ${campaign.end_date || ''}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openAddUpload(campaign)}>
                          <Plus className="mr-1 h-3 w-3" />
                          크리에이터 추가
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCampaign(campaign.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredUploads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        등록된 크리에이터가 없습니다. &quot;크리에이터 추가&quot; 버튼으로 추가해주세요.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">크리에이터</TableHead>
                            <TableHead className="w-[100px]">플랫폼</TableHead>
                            <TableHead>영상 제목</TableHead>
                            <TableHead className="w-[200px]">SNS URL</TableHead>
                            <TableHead className="w-[100px]">상태</TableHead>
                            <TableHead className="w-[100px]">등록일</TableHead>
                            <TableHead className="w-[150px]">관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUploads.map((upload) => (
                            <TableRow key={upload.id} className={upload.upload_status === 'PENDING' ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}>
                              <TableCell className="font-medium">{upload.creator_name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {getPlatformIcon(upload.platform)}
                                  <span className="text-sm">{SNS_PLATFORM_LABELS[upload.platform]}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm">
                                {upload.video_title || <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell>
                                {upload.sns_url ? (
                                  <a
                                    href={upload.sns_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 max-w-[180px] truncate"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{upload.sns_url}</span>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-sm">미등록</span>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(upload.upload_status)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {upload.uploaded_at
                                  ? new Date(upload.uploaded_at).toLocaleDateString('ko-KR')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => openEditUpload(upload, campaign)}
                                    title="수정"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {upload.upload_status === 'UPLOADED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-green-600"
                                      onClick={() => handleUpdateStatus(upload, 'VERIFIED')}
                                      title="확인"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {upload.upload_status === 'UPLOADED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-red-600"
                                      onClick={() => handleUpdateStatus(upload, 'REJECTED')}
                                      title="반려"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground"
                                    onClick={() => handleDeleteUpload(upload.id)}
                                    title="삭제"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {/* Summary */}
                    <div className="mt-4 flex gap-4 text-sm text-muted-foreground border-t pt-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-orange-500" />
                        미등록: {campaign.uploads.filter((u) => u.upload_status === 'PENDING').length}명
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        등록완료: {campaign.uploads.filter((u) => u.upload_status === 'UPLOADED').length}명
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        확인완료: {campaign.uploads.filter((u) => u.upload_status === 'VERIFIED').length}명
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        반려: {campaign.uploads.filter((u) => u.upload_status === 'REJECTED').length}명
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SNS 캠페인 추가</DialogTitle>
            <DialogDescription>
              새로운 SNS 컨텐츠 캠페인을 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>국가</Label>
                <Select
                  value={campaignForm.country}
                  onValueChange={(v) => setCampaignForm({ ...campaignForm, country: v as SnsCountry })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {SNS_COUNTRY_FLAGS[c]} {SNS_COUNTRY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>유형</Label>
                <Select
                  value={campaignForm.campaign_type}
                  onValueChange={(v) => setCampaignForm({ ...campaignForm, campaign_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="기획">기획</SelectItem>
                    <SelectItem value="숏폼">숏폼</SelectItem>
                    <SelectItem value="리뷰">리뷰</SelectItem>
                    <SelectItem value="라이브">라이브</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이벤트명</Label>
                <Input
                  placeholder="올영, 메가와리, Amazon 등"
                  value={campaignForm.event_name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, event_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>기간 (주)</Label>
                <Select
                  value={String(campaignForm.period_weeks)}
                  onValueChange={(v) => setCampaignForm({ ...campaignForm, period_weeks: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1주</SelectItem>
                    <SelectItem value="2">2주</SelectItem>
                    <SelectItem value="3">3주</SelectItem>
                    <SelectItem value="4">4주</SelectItem>
                    <SelectItem value="6">6주</SelectItem>
                    <SelectItem value="8">8주</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Input
                placeholder="캠페인 설명"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCampaign} disabled={!campaignForm.event_name}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => { setShowUploadDialog(open); if (!open) setEditingUpload(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUpload ? 'SNS 업로드 수정' : '크리에이터 SNS 업로드 추가'}
            </DialogTitle>
            <DialogDescription>
              {selectedCampaign && `${SNS_COUNTRY_FLAGS[selectedCampaign.country]} ${selectedCampaign.event_name} - ${selectedCampaign.campaign_type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>크리에이터 이름</Label>
              <Input
                placeholder="크리에이터 이름"
                value={uploadForm.creator_name}
                onChange={(e) => setUploadForm({ ...uploadForm, creator_name: e.target.value })}
                disabled={!!editingUpload}
              />
            </div>
            <div className="space-y-2">
              <Label>플랫폼</Label>
              <Select
                value={uploadForm.platform}
                onValueChange={(v) => setUploadForm({ ...uploadForm, platform: v as SnsPlatform })}
                disabled={!!editingUpload}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {SNS_PLATFORM_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SNS URL</Label>
              <Input
                placeholder={getUrlPlaceholder(uploadForm.platform)}
                value={uploadForm.sns_url}
                onChange={(e) => setUploadForm({ ...uploadForm, sns_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>영상 제목 (선택)</Label>
              <Input
                placeholder="업로드된 영상 제목"
                value={uploadForm.video_title}
                onChange={(e) => setUploadForm({ ...uploadForm, video_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>메모 (선택)</Label>
              <Input
                placeholder="관리자 메모"
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); setEditingUpload(null); }}>
              취소
            </Button>
            <Button onClick={handleSaveUpload} disabled={!uploadForm.creator_name}>
              {editingUpload ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getUrlPlaceholder(platform: SnsPlatform): string {
  switch (platform) {
    case 'youtube':
      return 'https://youtube.com/watch?v=... 또는 https://youtu.be/...';
    case 'instagram':
      return 'https://instagram.com/reel/... 또는 https://instagram.com/p/...';
    case 'tiktok':
      return 'https://tiktok.com/@user/video/...';
  }
}

function validateSnsUrl(url: string, platform: SnsPlatform): boolean {
  try {
    const parsed = new URL(url);
    switch (platform) {
      case 'youtube':
        return (
          parsed.hostname.includes('youtube.com') ||
          parsed.hostname.includes('youtu.be') ||
          parsed.hostname.includes('youtube.co')
        );
      case 'instagram':
        return parsed.hostname.includes('instagram.com');
      case 'tiktok':
        return (
          parsed.hostname.includes('tiktok.com') ||
          parsed.hostname.includes('vm.tiktok.com')
        );
      default:
        return true;
    }
  } catch {
    return false;
  }
}
