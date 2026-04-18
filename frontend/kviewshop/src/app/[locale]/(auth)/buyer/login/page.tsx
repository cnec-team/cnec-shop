'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LegalFooter } from '@/components/shop/legal-footer';
import { Loader2, AlertCircle, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

function getCallbackUrl(locale: string, returnUrl: string | null): string {
  if (returnUrl) return returnUrl;
  const cookies = document.cookie.split(';').reduce((acc, c) => {
    const [key, val] = c.trim().split('=');
    if (key && val) acc[key] = val;
    return acc;
  }, {} as Record<string, string>);
  const lastShopId = cookies['last_shop_id'];
  return lastShopId ? `/${locale}/${lastShopId}` : `/${locale}/no-shop-context`;
}

export default function BuyerLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [enabledProviders, setEnabledProviders] = useState({ kakao: false, naver: false, apple: false });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    fetch('/api/auth/providers-status')
      .then(r => r.json())
      .then(data => setEnabledProviders(data))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('account_locked')) {
          setLoginError('5회 실패로 5분간 잠겼습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        return;
      }

      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user?.role !== 'buyer') {
        setLoginError('구매자로 등록되지 않은 계정입니다.');
        await nextAuthSignOut({ redirect: false });
        return;
      }

      toast.success('환영합니다!');
      router.push(getCallbackUrl(locale, returnUrl));
    } catch {
      setLoginError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    const callbackUrl = getCallbackUrl(locale, returnUrl);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-4 pb-32">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href={`/${locale}`} className="inline-block mb-4">
              <span className="font-headline text-3xl font-bold text-gold-gradient">
                CNEC Shop
              </span>
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">로그인</h1>
            </div>
            <p className="text-sm text-gray-500">
              크넥샵에 로그인하세요
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {/* 소셜 로그인 */}
            <div className="space-y-3">
              {enabledProviders.kakao && (
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
                  카카오로 로그인
                </button>
              )}
              {enabledProviders.naver && (
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
                  네이버로 로그인
                </button>
              )}
              {enabledProviders.apple && (
                <button
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  disabled={!!socialLoading}
                  className="w-full h-12 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 bg-black"
                >
                  {socialLoading === 'apple' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg width="16" height="18" viewBox="0 0 16 18" fill="white"><path d="M13.3 9.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7C4.7 4.7 3.3 5.6 2.5 7c-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.5 1.3-2.6 0 0-2.4-1-2.4-3.2zM11 3.6c.6-.8 1.1-1.9 1-3C10.9.7 9.7 1.3 9 2.1c-.6.7-1.1 1.8-1 2.9C9.2 5.1 10.3 4.4 11 3.6z"/></svg>
                  )}
                  Apple로 로그인
                </button>
              )}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">
                  또는 이메일로 로그인
                </span>
              </div>
            </div>

            {/* 이메일 로그인 */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">올바른 이메일을 입력해주세요</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상"
                    autoComplete="current-password"
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
                  <p className="text-sm text-destructive">비밀번호는 8자 이상이어야 합니다</p>
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
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 flex justify-between items-center">
              <Link
                href={`/${locale}/buyer/forgot-password`}
                className="text-sm text-gray-500 hover:underline"
              >
                비밀번호 찾기
              </Link>
              <Link
                href={`/${locale}/buyer/signup${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
