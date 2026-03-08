'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Building2, Sparkles, Instagram, Check, X, Camera } from 'lucide-react';

type Role = 'creator' | 'brand_admin';

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const refCode = searchParams.get('ref');

  const [step, setStep] = useState(0); // 0=role, 1=basic, 2=social, 3=shop, 4=photo (creator only)
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<Role>('creator');

  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Brand fields
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');

  // Creator fields
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopId, setShopId] = useState('');
  const [shopIdAvailable, setShopIdAvailable] = useState<boolean | null>(null);
  const [shopIdChecking, setShopIdChecking] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');

  // shop_id validation with debounce
  const checkShopId = useCallback(async (id: string) => {
    if (id.length < 2) { setShopIdAvailable(null); return; }
    setShopIdChecking(true);
    try {
      const res = await fetch(`/api/auth/check-shop-id?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setShopIdAvailable(data.available);
    } catch {
      setShopIdAvailable(null);
    } finally {
      setShopIdChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!shopId || shopId.length < 2) { setShopIdAvailable(null); return; }
    const timer = setTimeout(() => checkShopId(shopId), 400);
    return () => clearTimeout(timer);
  }, [shopId, checkShopId]);

  const handleShopIdChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setShopId(cleaned.slice(0, 20));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const totalSteps = role === 'creator' ? 5 : 2;

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1:
        if (role === 'brand_admin') {
          return name.length >= 2 && email.includes('@') && password.length >= 8 && password === confirmPassword && companyName.length >= 2;
        }
        return name.length >= 2 && email.includes('@') && password.length >= 8 && password === confirmPassword;
      case 2: return instagram.length >= 2 || tiktok.length >= 2;
      case 3: return shopName.length >= 2 && shopId.length >= 2 && shopIdAvailable === true;
      case 4: return true; // photo is optional
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // TODO: Profile image upload will be handled separately (storage migration in M-3)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          companyName: role === 'brand_admin' ? companyName : undefined,
          businessNumber: role === 'brand_admin' ? businessNumber : undefined,
          shopId: role === 'creator' ? shopId : undefined,
          shopName: role === 'creator' ? shopName : undefined,
          instagram: role === 'creator' ? instagram : undefined,
          tiktok: role === 'creator' ? tiktok : undefined,
          youtube: role === 'creator' ? youtube : undefined,
          refCode: refCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '회원가입에 실패했습니다');
        return;
      }

      if (role === 'brand_admin') {
        toast.success('브랜드 등록이 완료되었습니다');
        router.push(`/${locale}/login`);
        return;
      }

      // Creator: redirect to persona quiz
      router.push(`/${locale}/signup/persona`);
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === totalSteps - 1) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border/50">
        <CardHeader className="text-center">
          <Link href={`/${locale}`} className="mb-2 inline-block">
            <span className="font-headline text-3xl font-bold text-gold-gradient">크넥샵</span>
          </Link>
          <CardTitle className="text-xl">
            {step === 0 ? '시작하기' : role === 'brand_admin' ? '브랜드 가입' : `크리에이터 가입 (${step}/${totalSteps - 1})`}
          </CardTitle>
          {/* Progress bar for creator */}
          {role === 'creator' && step > 0 && (
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 0: Role Selection */}
          {step === 0 && (
            <RadioGroup
              defaultValue="creator"
              onValueChange={(v) => setRole(v as Role)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="creator" id="creator" className="peer sr-only" />
                <Label htmlFor="creator" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <Sparkles className="mb-3 h-8 w-8 text-primary" />
                  <span className="font-medium">크리에이터</span>
                  <span className="text-xs text-muted-foreground mt-1">내 셀렉트샵 시작</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="brand_admin" id="brand_admin" className="peer sr-only" />
                <Label htmlFor="brand_admin" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <Building2 className="mb-3 h-8 w-8 text-primary" />
                  <span className="font-medium">브랜드</span>
                  <span className="text-xs text-muted-foreground mt-1">상품 등록 & 판매</span>
                </Label>
              </div>
            </RadioGroup>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="bg-muted" />
              </div>
              {role === 'brand_admin' && (
                <>
                  <div className="space-y-2">
                    <Label>회사명</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>사업자번호 (선택)</Label>
                    <Input value={businessNumber} onChange={e => setBusinessNumber(e.target.value)} className="bg-muted" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>비밀번호</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>비밀번호 확인</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-muted" />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Social Channels (Creator) */}
          {step === 2 && role === 'creator' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">대표 채널을 1개 이상 입력해주세요</p>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> 인스타그램</Label>
                <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>틱톡</Label>
                <Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>유튜브 (선택)</Label>
                <Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="채널 URL" className="bg-muted" />
              </div>
            </div>
          )}

          {/* Step 3: Shop Setup (Creator) */}
          {step === 3 && role === 'creator' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>샵 이름</Label>
                <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="뷰티진의 셀렉트샵" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>샵 ID</Label>
                <div className="flex items-center">
                  <span className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-xs text-muted-foreground">
                    shop.cnec.kr/
                  </span>
                  <Input
                    value={shopId}
                    onChange={e => handleShopIdChange(e.target.value)}
                    placeholder="myshop"
                    className="rounded-l-none bg-muted"
                    maxLength={20}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs min-h-[20px]">
                  {shopIdChecking && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  {shopIdAvailable === true && !shopIdChecking && (
                    <span className="text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> 사용 가능</span>
                  )}
                  {shopIdAvailable === false && !shopIdChecking && (
                    <span className="text-destructive flex items-center gap-1"><X className="h-3 w-3" /> 이미 사용 중</span>
                  )}
                  {shopId.length > 0 && shopId.length < 2 && (
                    <span className="text-muted-foreground">2자 이상 입력해주세요</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">영문 소문자, 숫자, 밑줄(_)만 사용 가능</p>
              </div>
            </div>
          )}

          {/* Step 4: Profile Photo (Creator) */}
          {step === 4 && role === 'creator' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">프로필 사진을 설정하세요 (나중에 변경 가능)</p>
              <div className="flex flex-col items-center gap-4">
                <label className="cursor-pointer">
                  <div className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-xs text-muted-foreground">클릭하여 업로드</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                이전
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
              className="flex-1 btn-gold"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 처리 중...</>
              ) : step === totalSteps - 1 ? (
                role === 'creator' ? '가입하고 시작하기' : '가입하기'
              ) : (
                '다음'
              )}
            </Button>
          </div>

          <div className="text-center text-sm pt-2">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link href={`/${locale}/login`} className="text-primary hover:underline">로그인</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
