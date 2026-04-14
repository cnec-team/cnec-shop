'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ShoppingBag, Eye, EyeOff, Gift, Heart, TrendingUp, Check } from 'lucide-react';
import { LegalFooter } from '@/components/shop/legal-footer';
import { Alert, AlertDescription } from '@/components/ui/alert';

const signupSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  confirmPassword: z.string().min(8, '비밀번호 확인을 입력해주세요'),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(30, '닉네임은 30자 이하여야 합니다'),
  phone: z.string().optional(),
  termsAccepted: z.literal(true, { error: '이용약관에 동의해주세요' }),
  privacyAccepted: z.literal(true, { error: '개인정보처리방침에 동의해주세요' }),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

export default function BuyerSignupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [socialProviders, setSocialProviders] = useState<{ kakao: boolean; naver: boolean }>({ kakao: false, naver: false });
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/providers-status')
      .then((r) => r.json())
      .then((data) => setSocialProviders(data))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      marketingConsent: false,
      termsAccepted: undefined as unknown as true,
      privacyAccepted: undefined as unknown as true,
    },
  });

  const termsAccepted = watch('termsAccepted');
  const privacyAccepted = watch('privacyAccepted');
  const marketingConsent = watch('marketingConsent');
  const phoneValue = watch('phone');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setSignupError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.nickname,
          role: 'buyer',
          phone: data.phone?.replace(/-/g, '') || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.error?.includes('이미 가입된')) {
          setSignupError('이미 가입된 이메일입니다. 로그인해주세요.');
        } else {
          setSignupError(errData.error || '회원가입에 실패했습니다.');
        }
        return;
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setSignupError('계정이 생성되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
        return;
      }

      toast.success('가입이 완료되었습니다!');
      // returnUrl이 있으면 그곳으로, 없으면 샵 홈으로 이동 (대시보드는 세션 동기화 레이스로 인해 제외)
      router.push(returnUrl || `/${locale}`);
      router.refresh();
    } catch {
      setSignupError('가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    signIn(provider, {
      callbackUrl: returnUrl || `/${locale}/buyer/dashboard`,
    });
  };

  const handleAllAgree = (checked: boolean) => {
    setValue('termsAccepted', checked as unknown as true);
    setValue('privacyAccepted', checked as unknown as true);
    setValue('marketingConsent', checked);
    trigger(['termsAccepted', 'privacyAccepted']);
  };

  const allAgreed = termsAccepted && privacyAccepted && marketingConsent;
  const hasSocialLogin = socialProviders.kakao || socialProviders.naver;

  const benefits = [
    { icon: Gift, text: '리뷰 작성 시 포인트 적립' },
    { icon: Heart, text: '좋아하는 크리에이터 샵 구독' },
    { icon: TrendingUp, text: '조건 충족 시 크리에이터 전환 가능' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href={`/${locale}`} className="inline-block mb-3">
            <span className="font-headline text-3xl font-bold text-gold-gradient">
              CNEC Shop
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">회원가입</h1>
          </div>
          <p className="text-sm text-gray-500">
            크넥샵에서 크리에이터 추천 제품을 만나보세요
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 간편 가입 */}
          {hasSocialLogin && (
            <div className="p-6 pb-0">
              <div className="space-y-3">
                {socialProviders.kakao && (
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('kakao')}
                    disabled={!!socialLoading}
                    className="w-full h-12 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#FEE500', color: '#191919' }}
                  >
                    {socialLoading === 'kakao' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.18l-.93 3.44c-.08.3.26.54.52.37l4.1-2.72c.22.02.44.03.68.03 4.42 0 8-2.79 8-6.3C17 3.79 13.42 1 9 1z" fill="#191919"/></svg>
                    )}
                    카카오로 시작하기
                  </button>
                )}
                {socialProviders.naver && (
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('naver')}
                    disabled={!!socialLoading}
                    className="w-full h-12 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#03C75A' }}
                  >
                    {socialLoading === 'naver' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18"><path d="M12.13 9.72L5.61 0H0v18h5.87V8.28L12.39 18H18V0h-5.87v9.72z" fill="white"/></svg>
                    )}
                    네이버로 시작하기
                  </button>
                )}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">
                    또는 이메일로 가입
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 이메일 가입 폼 */}
          <div className={hasSocialLogin ? 'px-6 pb-6' : 'p-6'}>
            {/* 회원 혜택 */}
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm font-semibold mb-2.5">회원 혜택</p>
              <div className="space-y-2">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <benefit.icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {signupError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{signupError}</AlertDescription>
                </Alert>
              )}

              {/* 이메일 */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">비밀번호 *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상"
                    autoComplete="new-password"
                    {...register('password')}
                    className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">비밀번호 확인 *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력해주세요"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* 닉네임 */}
              <div className="space-y-1.5">
                <Label htmlFor="nickname" className="text-sm font-semibold">닉네임 *</Label>
                <Input
                  id="nickname"
                  placeholder="사용할 닉네임 (2~30자)"
                  autoComplete="username"
                  {...register('nickname')}
                  className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                />
                {errors.nickname && (
                  <p className="text-sm text-destructive">{errors.nickname.message}</p>
                )}
              </div>

              {/* 전화번호 */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">전화번호 <span className="font-normal text-gray-400">(선택)</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  value={phoneValue || ''}
                  onChange={handlePhoneChange}
                  className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                />
              </div>

              {/* 약관 동의 */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                  {/* 전체 동의 */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <Checkbox
                      id="allAgree"
                      checked={!!allAgreed}
                      onCheckedChange={(checked) => handleAllAgree(checked as boolean)}
                    />
                    <label htmlFor="allAgree" className="text-sm font-semibold cursor-pointer flex-1">
                      전체 동의
                    </label>
                  </div>

                  {/* 이용약관 동의 */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="termsAccepted"
                      checked={!!termsAccepted}
                      onCheckedChange={(checked) => {
                        setValue('termsAccepted', checked as unknown as true);
                        trigger('termsAccepted');
                      }}
                    />
                    <label htmlFor="termsAccepted" className="text-sm cursor-pointer flex-1 text-gray-700">
                      <span className="text-destructive">[필수]</span>{' '}
                      <Link href={`/${locale}/terms`} className="underline">이용약관</Link> 동의
                    </label>
                  </div>

                  {/* 개인정보처리방침 동의 */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="privacyAccepted"
                      checked={!!privacyAccepted}
                      onCheckedChange={(checked) => {
                        setValue('privacyAccepted', checked as unknown as true);
                        trigger('privacyAccepted');
                      }}
                    />
                    <label htmlFor="privacyAccepted" className="text-sm cursor-pointer flex-1 text-gray-700">
                      <span className="text-destructive">[필수]</span>{' '}
                      <Link href={`/${locale}/privacy`} className="underline">개인정보처리방침</Link> 동의
                    </label>
                  </div>

                  {/* 마케팅 동의 */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="marketingConsent"
                      checked={!!marketingConsent}
                      onCheckedChange={(checked) => setValue('marketingConsent', checked as boolean)}
                    />
                    <label htmlFor="marketingConsent" className="text-sm cursor-pointer flex-1 text-gray-500">
                      [선택] 마케팅 정보 수신 동의
                    </label>
                  </div>
                </div>
                {(errors.termsAccepted || errors.privacyAccepted) && (
                  <p className="text-sm text-destructive">
                    {errors.termsAccepted?.message || errors.privacyAccepted?.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 처리 중...
                  </>
                ) : (
                  '가입하기'
                )}
              </Button>
            </form>

            {/* 로그인 링크 */}
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
              <Link
                href={`/${locale}/buyer/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
