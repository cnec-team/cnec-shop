'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ImageIcon,
  ChevronLeft,
  Eye,
  Sparkles,
  RefreshCw,
  CheckCircle,
  ShieldCheck,
  Plus,
  X as XIcon,
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
  principles: string[];
}

export default function CreatorShopPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [creator, setCreator] = useState<Record<string, any> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiTab, setAiTab] = useState<'suggest' | 'versions'>('suggest');
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
    principles: [],
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
          principles: c.principles || [],
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
        principles: form.principles,
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
    <div className="space-y-6 max-w-2xl pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">샵 꾸미기</h1>
            {creator?.displayName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                {creator.displayName}
              </span>
            )}
          </div>
        </div>
        {shopUrl && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-8"
            onClick={() => window.open(shopUrl, '_blank')}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            미리보기
          </Button>
        )}
      </div>

      {/* Live Preview Section — Phone Mockup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Live Preview</span>
        </div>
        <div className="px-4 pb-4">
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
            {/* Banner area */}
            <div className="h-32 sm:h-40 bg-gray-100 relative group">
              {form.bannerImageUrl ? (
                <img src={form.bannerImageUrl} alt="배너" className="w-full h-full object-cover" />
              ) : form.coverImageUrl ? (
                <img src={form.coverImageUrl} alt="커버" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageUpload
                  value={form.bannerImageUrl || form.coverImageUrl}
                  onChange={(url) => setForm({ ...form, bannerImageUrl: url, coverImageUrl: url })}
                  placeholder=""
                  aspectRatio="cover"
                  folder="creator/banner"
                  recommendedSize="1200x400px"
                  maxSizeMB={10}
                />
              </div>
              <div className="absolute bottom-2 right-2 pointer-events-none">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  배너 변경
                </span>
              </div>
            </div>

            {/* Profile preview inside mockup */}
            <div className="px-4 pb-4 relative bg-white">
              <div className="absolute -top-8 left-4">
                <div className="w-16 h-16 rounded-full border-3 border-white overflow-hidden bg-gray-100 shadow-sm">
                  {form.profileImageUrl ? (
                    <img src={form.profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-300">
                      {form.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-10">
                <p className="text-sm font-bold text-gray-900">{form.displayName || '샵 이름'}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{form.bio || '소개글을 입력해주세요'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Management Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ImageIcon className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">이미지 관리</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <Label className="text-sm font-medium text-gray-700 mb-1 block">프로필 이미지</Label>
            <p className="text-xs text-gray-400 mb-3">권장 사이즈 400x400px, 최대 5MB</p>
            <ImageUpload
              value={form.profileImageUrl}
              onChange={(url) => setForm({ ...form, profileImageUrl: url })}
              placeholder="프로필"
              folder="creator/profile"
              recommendedSize="400x400px"
              maxSizeMB={5}
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <Label className="text-sm font-medium text-gray-700 mb-1 block">배너 이미지</Label>
            <p className="text-xs text-gray-400 mb-3">권장 사이즈 1200x400px, 최대 10MB</p>
            <ImageUpload
              value={form.bannerImageUrl}
              onChange={(url) => setForm({ ...form, bannerImageUrl: url })}
              placeholder="배너"
              aspectRatio="banner"
              folder="creator/banner"
              recommendedSize="1200x400px"
              maxSizeMB={10}
            />
          </div>
        </div>
      </div>

      {/* Edit Fields — Name & Bio */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">기본 정보</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">샵 이름</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="샵 이름을 입력하세요"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">소개글</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="샵 소개를 입력하세요"
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      {shopUrl && (
        <div className="grid grid-cols-3 gap-2">
          <button
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors"
            onClick={() => window.open(shopUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mx-auto text-gray-500" />
            <p className="text-[11px] text-gray-500 mt-1.5 font-medium">샵 보기</p>
          </button>
          <button
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(shopUrl);
              toast('링크가 복사되었습니다');
            }}
          >
            <Copy className="h-4 w-4 mx-auto text-gray-500" />
            <p className="text-[11px] text-gray-500 mt-1.5 font-medium">URL 복사</p>
          </button>
          <button
            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors"
            onClick={() => window.open('https://www.instagram.com/', '_blank')}
          >
            <Instagram className="h-4 w-4 mx-auto text-gray-500" />
            <p className="text-[11px] text-gray-500 mt-1.5 font-medium">인스타 공유</p>
          </button>
        </div>
      )}

      {/* AI 퍼서스트 Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-semibold text-gray-900">소개글을 더 매력적으로</p>
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setAiTab('suggest')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                aiTab === 'suggest'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              추천 소개글
            </button>
            <button
              onClick={() => setAiTab('versions')}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                aiTab === 'versions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              3개 버전
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border-l-2 border-violet-300">
            <p className="text-sm text-gray-700 leading-relaxed italic">
              {form.bio
                ? `"${form.displayName || '나'}만의 뷰티 감각으로 엄선한 제품만 추천해요. ${
                    form.skinType
                      ? `${(SKIN_TYPE_LABELS as Record<string, string>)[form.skinType] ?? ''} 피부를 위한 `
                      : ''
                  }리얼 리뷰를 확인하세요."`
                : '"나만의 뷰티 철학으로 진짜 좋은 제품만 골라 추천합니다. 직접 써본 솔직 리뷰와 함께."'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs h-9">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              다시 생성
            </Button>
            <Button
              size="sm"
              className="flex-1 rounded-xl text-xs h-9 bg-violet-600 text-white hover:bg-violet-700"
              onClick={() => {
                const suggestedBio = form.bio
                  ? `${form.displayName || '나'}만의 뷰티 감각으로 엄선한 제품만 추천해요. ${
                      form.skinType
                        ? `${(SKIN_TYPE_LABELS as Record<string, string>)[form.skinType] ?? ''} 피부를 위한 `
                        : ''
                    }리얼 리뷰를 확인하세요.`
                  : '나만의 뷰티 철학으로 진짜 좋은 제품만 골라 추천합니다. 직접 써본 솔직 리뷰와 함께.';
                setForm({ ...form, bio: suggestedBio });
                toast.success('소개글이 적용되었습니다');
              }}
            >
              이걸로 적용
            </Button>
          </div>
        </div>
      </div>

      {/* 연동 Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">연동</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">인스타그램 연동</p>
              <p className="text-xs text-gray-400">
                {form.instagramHandle ? `@${form.instagramHandle}` : '아직 연결되지 않았어요'}
              </p>
            </div>
          </div>
          {form.instagramHandle ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              연결됨
            </span>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">미연결</span>
          )}
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
              <span className="text-[10px] text-green-600 font-medium shrink-0">연결됨</span>
            ) : (
              <span className="text-[10px] text-gray-400 shrink-0">미연결</span>
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
              <span className="text-[10px] text-green-600 font-medium shrink-0">연결됨</span>
            ) : (
              <span className="text-[10px] text-gray-400 shrink-0">미연결</span>
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
              <span className="text-[10px] text-green-600 font-medium shrink-0">연결됨</span>
            ) : (
              <span className="text-[10px] text-gray-400 shrink-0">미연결</span>
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

      {/* Operating Principles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-900" />
          <p className="text-sm font-semibold text-gray-900">내 운영 원칙</p>
        </div>
        <p className="text-xs text-gray-400">
          내 샵에 표시돼요. 팔로워에게 신뢰를 줄 수 있어요. (최대 5개)
        </p>
        <div className="space-y-2">
          {form.principles.map((principle, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={principle}
                onChange={(e) => {
                  const updated = [...form.principles];
                  updated[idx] = e.target.value;
                  setForm({ ...form, principles: updated });
                }}
                placeholder="예: 직접 써본 제품만 추천해요"
                maxLength={50}
                className="rounded-xl text-sm"
              />
              <button
                onClick={() => {
                  setForm({
                    ...form,
                    principles: form.principles.filter((_, i) => i !== idx),
                  });
                }}
                className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <XIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ))}
          {form.principles.length < 5 && (
            <button
              onClick={() => setForm({ ...form, principles: [...form.principles, ''] })}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              <Plus className="h-4 w-4" />
              원칙 추가
            </button>
          )}
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm py-3 px-4 border-t border-gray-100 z-10">
        <div className="max-w-2xl mx-auto">
          <Button
            className="w-full h-12 text-base bg-foreground text-white hover:bg-foreground/90 rounded-xl font-semibold"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '변경사항 저장하기'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
