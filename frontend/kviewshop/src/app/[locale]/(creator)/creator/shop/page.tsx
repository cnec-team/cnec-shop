'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  User,
  Instagram,
  Youtube,
  Music2,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/common/ImageUpload';
import { getCreatorSession, updateCreatorShopProfile } from '@/lib/actions/creator';
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

type SectionKey = 'images' | 'basic' | 'social' | 'beauty' | 'banner';

export default function CreatorShopPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<Record<string, any> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // On mobile, use accordion. On desktop, all open.
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['images', 'basic', 'social', 'beauty', 'banner']));
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

      toast.success('저장되었습니다');
      if (updated) {
        setCreator(updated as Record<string, any>);
      }
    } catch (error) {
      toast.error('저장에 실패했습니다');
      console.error('Save error:', error);
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

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-12 w-full rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const shopUrl = creator?.shopId ? `https://shop.cnec.kr/${creator.shopId}` : null;

  const AccordionHeader = ({ sectionKey, icon: Icon, title }: { sectionKey: SectionKey; icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="md:hidden flex items-center justify-between w-full p-4 text-left"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{title}</span>
      </div>
      {openSections.has(sectionKey) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">샵 프로필 설정</h1>
          <p className="text-sm text-muted-foreground">내 샵의 프로필과 뷰티 정보를 관리하세요</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />저장</>
          )}
        </Button>
      </div>

      {/* Shop Preview Link */}
      {shopUrl && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">내 샵 미리보기</span>
            </div>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                내 샵 보기
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cover & Profile Images */}
      <Card>
        <AccordionHeader sectionKey="images" icon={ImageIcon} title="이미지 설정" />
        <CardHeader className="hidden md:block">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            이미지 설정
          </CardTitle>
          <CardDescription>샵에 표시될 커버 이미지와 프로필 이미지를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className={`space-y-4 ${openSections.has('images') ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-2">
            <Label>커버 이미지</Label>
            <ImageUpload
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              placeholder="커버 이미지를 업로드하세요"
              aspectRatio="cover"
              folder="creator/cover"
            />
          </div>
          <div className="space-y-2">
            <Label>프로필 이미지</Label>
            <div className="max-w-[200px]">
              <ImageUpload
                value={form.profileImageUrl}
                onChange={(url) => setForm({ ...form, profileImageUrl: url })}
                placeholder="프로필 이미지"
                folder="creator/profile"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <AccordionHeader sectionKey="basic" icon={User} title="기본 정보" />
        <CardHeader className="hidden md:block">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-4 ${openSections.has('basic') ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-2">
            <Label>샵 이름</Label>
            <Input
              placeholder="나의 뷰티 셀렉트샵"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>샵 설명</Label>
            <Textarea
              placeholder="내 샵을 소개해 주세요"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Channels */}
      <Card>
        <AccordionHeader sectionKey="social" icon={LinkIcon} title="대표 채널 URL" />
        <CardHeader className="hidden md:block">
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            대표 채널 URL
          </CardTitle>
          <CardDescription>SNS 채널 주소를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className={`space-y-4 ${openSections.has('social') ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Instagram className="h-4 w-4" /> Instagram
            </Label>
            <Input
              placeholder="https://instagram.com/yourhandle"
              value={form.instagramHandle}
              onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Youtube className="h-4 w-4" /> YouTube
            </Label>
            <Input
              placeholder="https://youtube.com/@yourchannel"
              value={form.youtubeHandle}
              onChange={(e) => setForm({ ...form, youtubeHandle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Music2 className="h-4 w-4" /> TikTok
            </Label>
            <Input
              placeholder="https://tiktok.com/@yourhandle"
              value={form.tiktokHandle}
              onChange={(e) => setForm({ ...form, tiktokHandle: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Beauty Profile Tags */}
      <Card>
        <AccordionHeader sectionKey="beauty" icon={Sparkles} title="뷰티 프로필 태그" />
        <CardHeader className="hidden md:block">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            뷰티 프로필 태그
          </CardTitle>
          <CardDescription>뷰티 프로필 정보를 설정하면 맞춤 추천에 활용됩니다</CardDescription>
        </CardHeader>
        <CardContent className={`space-y-6 ${openSections.has('beauty') ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-2">
            <Label>피부 타입</Label>
            <Select
              value={form.skinType}
              onValueChange={(value) => setForm({ ...form, skinType: value as SkinType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="피부 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SKIN_TYPE_LABELS) as [SkinType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>퍼스널 컬러</Label>
            <Select
              value={form.personalColor}
              onValueChange={(value) => setForm({ ...form, personalColor: value as PersonalColor })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="퍼스널 컬러 선택" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PERSONAL_COLOR_LABELS) as [PersonalColor, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>피부 고민 (복수 선택)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SKIN_CONCERNS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
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

          <div className="space-y-3">
            <Label>두피 고민 (복수 선택)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SCALP_CONCERNS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Checkbox
                    checked={form.scalpConcerns.includes(option.value)}
                    onCheckedChange={() => toggleScalpConcern(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner Settings */}
      <Card>
        <AccordionHeader sectionKey="banner" icon={ImageIcon} title="배너 설정" />
        <CardHeader className="hidden md:block">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            배너 설정
          </CardTitle>
          <CardDescription>샵 상단에 표시되는 배너를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className={`space-y-4 ${openSections.has('banner') ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-2">
            <Label>배너 이미지</Label>
            <ImageUpload
              value={form.bannerImageUrl}
              onChange={(url) => setForm({ ...form, bannerImageUrl: url })}
              placeholder="배너 이미지를 업로드하세요"
              aspectRatio="banner"
              folder="creator/banner"
            />
          </div>
          <div className="space-y-2">
            <Label>배너 클릭 링크</Label>
            <Input
              placeholder="https://example.com/promotion"
              value={form.bannerLink}
              onChange={(e) => setForm({ ...form, bannerLink: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sticky Save Button */}
      <div className="sticky bottom-16 md:bottom-0 bg-background py-3 border-t z-10">
        <Button className="w-full h-12 text-base" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />변경사항 저장</>
          )}
        </Button>
      </div>
    </div>
  );
}
