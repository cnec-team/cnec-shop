'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('이메일 형식을 확인해주세요'),
  password: z.string().min(8, '8자 이상 입력해주세요'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function CreatorLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // 소셜 로그인 콜백 처리
  useEffect(() => {
    if (searchParams.get('from') !== 'social') return;
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session?.user?.role === 'creator') {
          router.push(returnUrl || `/${locale}/creator/dashboard`);
        } else if (session?.user) {
          setLoginError('크리에이터 계정이 아닙니다. 크리에이터로 가입해주세요.');
          const { signOut: nextSignOut } = await import('next-auth/react');
          await nextSignOut({ redirect: false });
        }
      } catch {}
    };
    checkSession();
  }, [searchParams, router, locale, returnUrl]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError('이메일 또는 비밀번호가 올바르지 않습니다');
        return;
      }

      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user?.role !== 'creator') {
        setLoginError('크리에이터 계정이 아닙니다');
        const { signOut: nextSignOut } = await import('next-auth/react');
        await nextSignOut({ redirect: false });
        return;
      }

      router.push(returnUrl || `/${locale}/creator/dashboard`);
    } catch {
      setLoginError('로그인 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    const callback = `/${locale}/creator/login?from=social${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
    signIn(provider, { callbackUrl: callback });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          {/* 로고 */}
          <div className="text-center mb-10">
            <Link href={`/${locale}`} className="inline-block">
              <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">CNEC Shop</h1>
            </Link>
            <p className="text-[15px] text-gray-500 mt-1.5">크리에이터 센터</p>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-3 mb-8">
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              disabled={!!socialLoading}
              className="relative w-full h-[52px] rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:brightness-[0.97] active:scale-[0.995] transition-all disabled:opacity-60"
            >
              {socialLoading === 'kakao' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
                    <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.37.32.67.65.47l4.96-3.26c.37.04.74.06 1.13.06 5.52 0 10-3.36 10-7.44C22 6.36 17.52 3 12 3z" />
                  </svg>
                  카카오로 계속하기
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('naver')}
              disabled={!!socialLoading}
              className="relative w-full h-[52px] rounded-xl bg-[#03C75A] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:brightness-[0.95] active:scale-[0.995] transition-all disabled:opacity-60"
            >
              {socialLoading === 'naver' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="font-bold text-[18px] leading-none">N</span>
                  네이버로 계속하기
                </>
              )}
            </button>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[13px] text-gray-400 whitespace-nowrap">또는 이메일로 로그인</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 이메일/비밀번호 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {loginError && (
              <div className="flex items-center gap-2.5 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-[14px]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="email"
                  placeholder="이메일"
                  {...register('email')}
                  className="w-full h-[52px] rounded-xl bg-gray-50 border border-gray-200 text-[15px] pl-11 pr-4 placeholder:text-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[13px] mt-1.5 ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호"
                  {...register('password')}
                  className="w-full h-[52px] rounded-xl bg-gray-50 border border-gray-200 text-[15px] pl-11 pr-12 placeholder:text-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[13px] mt-1.5 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] rounded-xl bg-gray-900 text-white font-semibold text-[15px] hover:bg-gray-800 active:scale-[0.995] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : '로그인'}
            </button>
          </form>

          {/* 하단 링크 */}
          <div className="mt-10 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-[14px]">
              <span className="text-gray-400">계정이 없으신가요?</span>
              <Link
                href={`/${locale}/signup?role=creator`}
                className="text-gray-900 font-medium hover:underline inline-flex items-center gap-0.5"
              >
                크리에이터 가입
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="text-[13px]">
              <span className="text-gray-400">브랜드이신가요? </span>
              <Link href={`/${locale}/brand/login`} className="text-gray-500 hover:text-gray-700 hover:underline">
                브랜드 센터
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
