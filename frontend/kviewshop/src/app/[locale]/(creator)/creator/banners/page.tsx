'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Eye,
  EyeOff,
  ImageIcon,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCreatorSession,
  getCreatorBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '@/lib/actions/creator';

// ── Local types ──────────────────────────────────────────────────────
type BannerType = 'HORIZONTAL' | 'VERTICAL';
type LinkType = 'EXTERNAL' | 'COLLECTION' | 'PRODUCT';

interface Banner {
  id: string;
  creatorId: string;
  imageUrl: string;
  bannerType: string;
  linkUrl: string;
  linkType: string;
  isVisible: boolean;
  displayOrder: number;
  createdAt?: string;
}

const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  HORIZONTAL: '가로형',
  VERTICAL: '세로형',
};

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  EXTERNAL: '외부 링크',
  COLLECTION: '컬렉션',
  PRODUCT: '상품',
};

// ── Page component ──────────────────────────────────────────────────────
export default function CreatorBannersPage() {
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // New banner form
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    imageUrl: string;
    bannerType: BannerType;
    linkUrl: string;
    linkType: LinkType;
  }>({
    imageUrl: '',
    bannerType: 'HORIZONTAL',
    linkUrl: '',
    linkType: 'EXTERNAL',
  });

  // ── Data fetching ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const data = await getCreatorBanners(creatorData.id);
        if (!cancelled) {
          setBanners(data as unknown as Banner[]);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ── Reset form ──────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      imageUrl: '',
      bannerType: 'HORIZONTAL',
      linkUrl: '',
      linkType: 'EXTERNAL',
    });
    setShowForm(false);
    setEditingId(null);
  };

  // ── Create / Edit ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.imageUrl.trim() && !form.linkUrl.trim()) {
      toast.error('이미지 URL 또는 링크 URL을 입력해주세요');
      return;
    }

    setCreating(true);

    try {
      if (editingId) {
        const updated = await updateBanner(editingId, {
          imageUrl: form.imageUrl.trim(),
          bannerType: form.bannerType,
          linkUrl: form.linkUrl.trim(),
          linkType: form.linkType,
        });
        setBanners((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...updated } as unknown as Banner : b))
        );
        toast.success('배너가 수정되었습니다');
      } else {
        const banner = await createBanner({
          creatorId: creator?.id ?? '',
          imageUrl: form.imageUrl.trim(),
          bannerType: form.bannerType,
          linkUrl: form.linkUrl.trim(),
          linkType: form.linkType,
          displayOrder: banners.length,
        });
        setBanners((prev) => [...prev, banner as unknown as Banner]);
        toast.success('배너가 생성되었습니다');
      }

      resetForm();
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setForm({
      imageUrl: banner.imageUrl,
      bannerType: banner.bannerType as BannerType,
      linkUrl: banner.linkUrl,
      linkType: banner.linkType as LinkType,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async (bannerId: string) => {
    if (!confirm('이 배너를 삭제하시겠습니까?')) return;

    try {
      await deleteBanner(bannerId);
      setBanners((prev) =>
        prev
          .filter((b) => b.id !== bannerId)
          .map((b, i) => ({ ...b, displayOrder: i }))
      );
      if (editingId === bannerId) resetForm();
      toast.success('배너가 삭제되었습니다');
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  // ── Toggle visibility ───────────────────────────────────────────────
  const handleToggleVisibility = async (bannerId: string) => {
    const banner = banners.find((b) => b.id === bannerId);
    if (!banner) return;

    const newVisible = !banner.isVisible;
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, isVisible: newVisible } : b))
    );

    try {
      await updateBanner(bannerId, { isVisible: newVisible });
    } catch (error) {
      setBanners((prev) =>
        prev.map((b) => (b.id === bannerId ? { ...b, isVisible: !newVisible } : b))
      );
    }
  };

  // ── Reorder ─────────────────────────────────────────────────────────
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((b, i) => ({ ...b, displayOrder: i }));
    setBanners(reordered);

    try {
      for (const b of reordered) {
        await updateBanner(b.id, { displayOrder: b.displayOrder });
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 mt-2 bg-muted rounded animate-pulse" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 w-full bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            배너 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            내 셀렉트샵에 노출할 배너를 관리합니다
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 배너
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? '배너 수정' : '새 배너 만들기'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>이미지 URL</Label>
              <Input
                placeholder="https://example.com/banner.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
              {form.imageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={form.imageUrl}
                    alt="배너 미리보기"
                    className={
                      form.bannerType === 'HORIZONTAL'
                        ? 'w-full h-32 object-cover'
                        : 'w-32 h-48 object-cover'
                    }
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>배너 유형</Label>
                <Select
                  value={form.bannerType}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, bannerType: v as BannerType }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="배너 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HORIZONTAL">가로형</SelectItem>
                    <SelectItem value="VERTICAL">세로형</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>링크 유형</Label>
                <Select
                  value={form.linkType}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, linkType: v as LinkType }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="링크 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXTERNAL">외부 링크</SelectItem>
                    <SelectItem value="COLLECTION">컬렉션</SelectItem>
                    <SelectItem value="PRODUCT">상품</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>링크 URL</Label>
              <Input
                placeholder={
                  form.linkType === 'EXTERNAL'
                    ? 'https://example.com'
                    : form.linkType === 'COLLECTION'
                      ? '/collections/collection-id'
                      : '/products/product-id'
                }
                value={form.linkUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
              />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? '수정' : '생성'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners List */}
      {banners.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">아직 배너가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              새 배너를 만들어 셀렉트샵을 꾸며 보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        banners.map((banner, index) => (
          <Card key={banner.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === banners.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Banner info */}
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      배너 {index + 1}
                      <Badge variant="secondary">
                        {BANNER_TYPE_LABELS[banner.bannerType as BannerType] ?? banner.bannerType}
                      </Badge>
                      <Badge variant="outline">
                        {LINK_TYPE_LABELS[banner.linkType as LinkType] ?? banner.linkType}
                      </Badge>
                    </CardTitle>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {banner.isVisible ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={banner.isVisible}
                      onCheckedChange={() => handleToggleVisibility(banner.id)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Banner preview */}
              <div
                className={`rounded-lg overflow-hidden border bg-muted ${
                  banner.bannerType === 'HORIZONTAL'
                    ? 'w-full h-32'
                    : 'w-32 h-48'
                }`}
              >
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={`배너 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Link info */}
              {banner.linkUrl && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  {banner.linkType === 'EXTERNAL' ? (
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  ) : (
                    <Link2 className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{banner.linkUrl}</span>
                </div>
              )}

              {/* Edit button */}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleEdit(banner)}
              >
                수정
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
