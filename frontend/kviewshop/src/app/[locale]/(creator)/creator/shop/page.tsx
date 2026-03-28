'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Loader2,
  Instagram,
  Youtube,
  Music2,
  ExternalLink,
  Copy,
  Camera,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/common/ImageUpload';
import { getCreatorSession, updateCreatorShopProfile } from '@/lib/actions/creator';
import { getShopUrl } from '@/lib/utils/beauty-labels';
import {
  SKIN_TYPE_LABELS,
  PERSONAL_COLOR_LABELS,
} from '@/types/database';

type SkinType = 'DRY' | 'OILY' | 'COMBINATION' | 'SENSITIVE' | 'NORMAL';
type PersonalColor = 'SPRING_WARM' | 'SUMMER_COOL' | 'AUTUMN_WARM' | 'WINTER_COOL';

const SKIN_CONCERNS_OPTIONS = [
  { value: 'acne', label: '여드름' },
  { value: 'wrinkle', label: '주름' },
  { value: 'pigmentation', label: '색소침착' },
  { value: 'pore', label: '모공' },
  { value: 'sensitivity', label: '민감성' },
  { value: 'dryness', label: '건조' },
  { value: 'redness', label: '홍조' },
  { value: 'dark_circles', label: '다크서클' },
];

const SCALP_CONCERNS_OPTIONS = [
  { value: 'hair_loss', label: '탈모' },
  { value: 'dandruff', label: '비듬' },
  { value: 'oily_scalp', label: '지성 두피' },
  { value: 'dry_scalp', label: '건성 두피' },
  { value: 'sensitive_scalp', label: '민감성 두피' },
  { value: 'thin_hair', label: '가는 모발' },
];

interface ShopForm {
  displayName: string;
  bio: string;
  coverImageUrl: string;
  profileImageUrl: string;
  instagramHandle: string;
  youtubeHandle: string;
  tiktokHandle: string;
  skinType: SkinType | '';
  personalColor: PersonalColor | '';
  skinConcerns: string[];
  scalpConcerns: string[];
  bannerImageUrl: string;
  bannerLink: string;
}

export default function CreatorShopPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<Record<string, any> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<ShopForm>({
    displayName: '',
    bio: '',
    coverImageUrl: '',
    profileImageUrl: '',
    instagramHandle: '',
    youtubeHandle: '',
    tiktokHandle: '',
    skinType: '',
    personalColor: '',
    skinConcerns: [],
    scalpConcerns: [],
    bannerImageUrl: '',
    bannerLink: '',
  });

  useEffect(() => {
    async function init() {
      const creatorData = await getCreatorSession();
      if (creatorData) {
        const c = creatorData as Record<string, any>;
        setCreator(c);
        setForm({
          displayName: c.displayName || '',
          bio: c.bio || '',
          coverImageUrl: c.coverImageUrl || '',
          profileImageUrl: c.profileImageUrl || '',
          instagramHandle: c.instagramHandle || '',
          youtubeHandle: c.youtubeHandle || '',
          tiktokHandle: c.tiktokHandle || '',
          skinType: c.skinType || '',
          personalColor: c.personalColor || '',
          skinConcerns: c.skinConcerns || [],
          scalpConcerns: c.scalpConcerns || [],
          bannerImageUrl: c.bannerImageUrl || '',
          bannerLink: c.bannerLink || '',
        });
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const handleSave = async () => {
    if (!creator) return;
    setIsSaving(true);
    try {
      const updated = await updateCreatorShopProfile({
        creatorId: creator.id,
        displayName: form.displayName || undefined,
        bio: form.bio || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
        instagramHandle: form.instagramHandle || undefined,
        youtubeHandle: form.youtubeHandle || undefined,
        tiktokHandle: form.tiktokHandle || undefined,
        skinType: form.skinType || undefined,
        personalColor: form.personalColor || undefined,
        skinConcerns: form.skinConcerns,
        scalpConcerns: form.scalpConcerns,
        bannerImageUrl: form.bannerImageUrl || undefined,
        bannerLink: form.bannerLink || undefined,
      });
      toast.success('저장했어요!');
      if (updated) setCreator(updated as Record<string, any>);
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSkinConcern = (value: string) => {
    setForm((prev) => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(value)
        ? prev.skinConcerns.filter((c) => c !== value)
        : [...prev.skinConcerns, value],
    }));
  };

  const toggleScalpConcern = (value: string) => {
    setForm((prev) => ({
      ...prev,
      scalpConcerns: prev.scalpConcerns.includes(value)
        ? prev.scalpConcerns.filter((c) => c !== value)
        : [...prev.scalpConcerns, value],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const shopUrl = creator?.shopId ? getShopUrl(creator.shopId) : null;

  return (
    <div className="space-y-6 max-w-2xl pb-24">
      {/* Instagram-style Profile Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 sm:h-40 bg-gray-100 relative group">
          {form.coverImageUrl ? (
            <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
            <ImageUpload
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              placeholder=""
              aspectRatio="cover"
              folder="creator/cover"
            />
          </div>
        </div>

        {/* Profile section */}
        <div className="px-5 pb-5 relative">
          {/* Profile image */}
          <div className="absolute -top-10 left-5">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-gray-100 relative group">
              {form.profileImageUrl ? (
                <img src={form.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-300">
                  {form.displayName?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Name and bio - inline edit */}
          <div className="pt-14 space-y-3">
            <Input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="샵 이름을 입력하세요"
              className="border-0 border-b border-gray-100 rounded-none px-0 text-lg font-bold focus-visible:ring-0 focus-visible:border-gray-900"
            />
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="샵 소개를 입력하세요"
              rows={2}
              className="border-0 border-b border-gray-100 rounded-none px-0 text-sm text-gray-500 resize-none focus-visible:ring-0 focus-visible:border-gray-900"
            />
          </div>

          {/* Quick Actions */}
          {shopUrl && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors"
                onClick={() => window.open(shopUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mx-auto text-gray-500" />
                <p className="text-[11px] text-gray-500 mt-1">내 샵 보기</p>
              </button>
              <button
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(shopUrl);
                  toast('링크가 복사되었습니다');
                }}
              >
                <Copy className="h-4 w-4 mx-auto text-gray-500" />
                <p className="text-[11px] text-gray-500 mt-1">URL 복사</p>
              </button>
              <button
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors"
                onClick={() => window.open('https://www.instagram.com/', '_blank')}
              >
                <Instagram className="h-4 w-4 mx-auto text-gray-500" />
                <p className="text-[11px] text-gray-500 mt-1">인스타에 공유</p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image upload cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <Label className="text-xs text-gray-500 mb-2 block">프로필 이미지</Label>
          <ImageUpload
            value={form.profileImageUrl}
            onChange={(url) => setForm({ ...form, profileImageUrl: url })}
            placeholder="프로필"
            folder="creator/profile"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <Label className="text-xs text-gray-500 mb-2 block">배너 이미지</Label>
          <ImageUpload
            value={form.bannerImageUrl}
            onChange={(url) => setForm({ ...form, bannerImageUrl: url })}
            placeholder="배너"
            aspectRatio="banner"
            folder="creator/banner"
          />
        </div>
      </div>

      {/* Social */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">대표 채널</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Instagram className="h-4 w-4 text-gray-400 shrink-0" />
            <Input
              placeholder="인스타그램 핸들"
              value={form.instagramHandle}
              onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
              className="rounded-xl"
            />
            {form.instagramHandle ? (
              <span className="text-[10px] text-green-600 font-medium">연결됨</span>
            ) : (
              <span className="text-[10px] text-gray-400">미연결</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Youtube className="h-4 w-4 text-gray-400 shrink-0" />
            <Input
              placeholder="유튜브 채널"
              value={form.youtubeHandle}
              onChange={(e) => setForm({ ...form, youtubeHandle: e.target.value })}
              className="rounded-xl"
            />
            {form.youtubeHandle ? (
              <span className="text-[10px] text-green-600 font-medium">연결됨</span>
            ) : (
              <span className="text-[10px] text-gray-400">미연결</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Music2 className="h-4 w-4 text-gray-400 shrink-0" />
            <Input
              placeholder="틱톡 핸들"
              value={form.tiktokHandle}
              onChange={(e) => setForm({ ...form, tiktokHandle: e.target.value })}
              className="rounded-xl"
            />
            {form.tiktokHandle ? (
              <span className="text-[10px] text-green-600 font-medium">연결됨</span>
            ) : (
              <span className="text-[10px] text-gray-400">미연결</span>
            )}
          </div>
        </div>
      </div>

      {/* Beauty Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <p className="text-sm font-semibold text-gray-900">뷰티 프로필</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">피부 타입</Label>
            <Select value={form.skinType} onValueChange={(v) => setForm({ ...form, skinType: v as SkinType })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {(Object.entries(SKIN_TYPE_LABELS) as [SkinType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">퍼스널 컬러</Label>
            <Select value={form.personalColor} onValueChange={(v) => setForm({ ...form, personalColor: v as PersonalColor })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {(Object.entries(PERSONAL_COLOR_LABELS) as [PersonalColor, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-gray-500">피부 고민 (복수 선택)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SKIN_CONCERNS_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <Checkbox
                  checked={form.skinConcerns.includes(option.value)}
                  onCheckedChange={() => toggleSkinConcern(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-gray-500">두피 고민 (복수 선택)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SCALP_CONCERNS_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <Checkbox
                  checked={form.scalpConcerns.includes(option.value)}
                  onCheckedChange={() => toggleScalpConcern(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Banner link */}
      {form.bannerImageUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">배너 클릭 링크</p>
          <Input
            placeholder="https://example.com/promotion"
            value={form.bannerLink}
            onChange={(e) => setForm({ ...form, bannerLink: e.target.value })}
            className="rounded-xl"
          />
        </div>
      )}

      {/* Sticky Save */}
      <div className="sticky bottom-16 md:bottom-0 bg-white/95 backdrop-blur-sm py-3 border-t border-gray-100 z-10 -mx-4 px-4 md:mx-0 md:px-0">
        <Button className="w-full h-12 text-base bg-gray-900 text-white hover:bg-gray-800 rounded-xl" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : <><Save className="mr-2 h-4 w-4" />변경사항 저장</>}
        </Button>
      </div>
    </div>
  );
}
