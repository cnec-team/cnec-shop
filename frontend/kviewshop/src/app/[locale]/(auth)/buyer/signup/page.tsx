'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Loader2, AlertCircle, ShoppingBag, Eye, EyeOff, ChevronLeft,
} from 'lucide-react';
import { LegalFooter } from '@/components/shop/legal-footer';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Step = 'email' | 'existing' | 'new';

interface EmailCheckResult {
  exists: boolean;
  name: string | null;
  hasSocial: boolean;
  socialProvider: string | null;
}

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

const SOCIAL_PROVIDER_LABELS: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  apple: 'Apple',
};

export default function BuyerSignupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailCheck, setEmailCheck] = useState<EmailCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [enabledProviders, setEnabledProviders] = useState({ kakao: false, naver: false, apple: false });
  const submittingRef = useRef(false);

  // Form fields (Step 2B)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeElectronic, setAgreeElectronic] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Step 2A login fields
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Fetch enabled providers
  useEffect(() => {
    fetch('/api/auth/providers-status')
      .then(r => r.json())
      .then(data => setEnabledProviders(data))
      .catch(() => {});
  }, []);

  // Password validation
  const passwordValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const requiredAgreed = agreeAge && agreeTerms && agreePrivacy && agreeElectronic;
  const formValid = passwordValid && name.length >= 2 && requiredAgreed;

  const handleAllAgree = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeAge(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeElectronic(checked);
    setMarketingOptIn(checked);
  };

  useEffect(() => {
    const all = agreeAge && agreeTerms && agreePrivacy && agreeElectronic && marketingOptIn;
    setAgreeAll(all);
  }, [agreeAge, agreeTerms, agreePrivacy, agreeElectronic, marketingOptIn]);

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // Step 1: Check email
  const handleEmailContinue = async () => {
    if (!email.includes('@')) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.status === 429) {
        setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      const data = await res.json();
      setEmailCheck(data);
      setStep(data.exists ? 'existing' : 'new');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2A: Login with existing email
  const handleLogin = async () => {
    if (submittingRef.current || isLoading) return;
    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('account_locked')) {
          setError('5회 실패로 5분간 잠겼습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        return;
      }

      toast.success('환영합니다!');
      router.push(getCallbackUrl(locale, returnUrl));
      router.refresh();
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  // Step 2B: Register new account
  const handleSignup = async () => {
    if (submittingRef.current || isLoading || !formValid) return;
    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name,
          phone: phone.replace(/-/g, '') || undefined,
          agreeAge: true,
          agreeTerms: true,
          agreePrivacy: true,
          agreeElectronic: true,
          marketingOptIn,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.error === 'email_exists') {
          setError('이미 가입된 이메일입니다.');
        } else if (errData.error === 'too_many_requests') {
          setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('회원가입에 실패했습니다.');
        }
        return;
      }

      // 자동 로그인
      sessionStorage.setItem('welcomeToast', '1');
      const signInResult = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('계정이 생성되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.');
        return;
      }

      toast.success('가입 축하드려요! 3,000P가 지급됐어요');
      router.push(getCallbackUrl(locale, returnUrl));
      router.refresh();
    } catch {
      setError('가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    const callbackUrl = getCallbackUrl(locale, returnUrl);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 py-8 px-4">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href={`/${locale}`} className="inline-block mb-3">
              <span className="font-headline text-3xl font-bold text-gold-gradient">
                CNEC Shop
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Step 1: Email Input */}
            {step === 'email' && (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold">시작하려면 이메일을 입력해주세요</h1>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  기존 회원이면 로그인, 새로운 분이면 가입으로 안내해드려요
                </p>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="example@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEmailContinue()}
                      className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                    disabled={isLoading || !email.includes('@')}
                    onClick={handleEmailContinue}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />확인 중...</>
                    ) : '계속하기'}
                  </Button>
                </div>

                {/* Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">또는</span>
                  </div>
                </div>

                {/* Social Buttons */}
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
                      카카오로 시작하기
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
                      네이버로 시작하기
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
                      Apple로 시작하기
                    </button>
                  )}
                </div>

                {/* Login link */}
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
            )}

            {/* Step 2A: Existing email */}
            {step === 'existing' && emailCheck && (
              <div className="p-6">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); }}
                  className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" /> 이메일 변경
                </button>

                <h1 className="text-xl font-bold mb-1">다시 오셨군요!</h1>
                {emailCheck.name && (
                  <p className="text-sm text-gray-600 mb-4">{emailCheck.name}님, 환영합니다</p>
                )}

                <div className="mb-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                  {email}
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {emailCheck.hasSocial && emailCheck.socialProvider ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {SOCIAL_PROVIDER_LABELS[emailCheck.socialProvider] || emailCheck.socialProvider}로 가입하셨어요
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSocialLogin(emailCheck.socialProvider!)}
                      disabled={!!socialLoading}
                      className="w-full h-12 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      style={
                        emailCheck.socialProvider === 'kakao'
                          ? { backgroundColor: '#FEE500', color: '#191919' }
                          : emailCheck.socialProvider === 'naver'
                          ? { backgroundColor: '#03C75A', color: '#fff' }
                          : { backgroundColor: '#000', color: '#fff' }
                      }
                    >
                      {socialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {SOCIAL_PROVIDER_LABELS[emailCheck.socialProvider] || emailCheck.socialProvider}로 로그인
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="loginPassword" className="text-sm font-semibold">비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="loginPassword"
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder="비밀번호를 입력해주세요"
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                          className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                      disabled={isLoading || loginPassword.length < 8}
                      onClick={handleLogin}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />로그인 중...</>
                      ) : '로그인'}
                    </Button>

                    <div className="text-center">
                      <Link
                        href={`/${locale}/buyer/forgot-password`}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        비밀번호 찾기
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2B: New signup */}
            {step === 'new' && (
              <div className="p-6">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); }}
                  className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" /> 이메일 변경
                </button>

                <h1 className="text-xl font-bold mb-1">새로 가입하시는군요!</h1>
                <div className="mb-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                  {email}
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-5">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-semibold">비밀번호 *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호"
                        autoComplete="new-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
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
                    <p className={`text-xs ${passwordValid ? 'text-green-600' : 'text-gray-400'}`}>
                      8자 이상 · 영문+숫자 포함
                    </p>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-semibold">이름 *</Label>
                    <Input
                      id="name"
                      placeholder="이름 (2자 이상)"
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      휴대폰 <span className="font-normal text-gray-400">(선택)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="010-0000-0000"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                    />
                  </div>

                  {/* Terms */}
                  <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                    {/* All agree */}
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <Checkbox
                        id="agreeAll"
                        checked={agreeAll}
                        onCheckedChange={(c) => handleAllAgree(c as boolean)}
                      />
                      <label htmlFor="agreeAll" className="text-sm font-semibold cursor-pointer flex-1">
                        전체 동의
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="agreeAge" checked={agreeAge} onCheckedChange={(c) => setAgreeAge(c as boolean)} />
                      <label htmlFor="agreeAge" className="text-sm cursor-pointer flex-1 text-gray-700">
                        <span className="text-destructive">[필수]</span> 만 14세 이상
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="agreeTerms" checked={agreeTerms} onCheckedChange={(c) => setAgreeTerms(c as boolean)} />
                      <label htmlFor="agreeTerms" className="text-sm cursor-pointer flex-1 text-gray-700">
                        <span className="text-destructive">[필수]</span>{' '}
                        <Link href={`/${locale}/terms`} className="underline">이용약관</Link> 동의
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="agreePrivacy" checked={agreePrivacy} onCheckedChange={(c) => setAgreePrivacy(c as boolean)} />
                      <label htmlFor="agreePrivacy" className="text-sm cursor-pointer flex-1 text-gray-700">
                        <span className="text-destructive">[필수]</span>{' '}
                        <Link href={`/${locale}/privacy`} className="underline">개인정보 수집·이용</Link> 동의
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="agreeElectronic" checked={agreeElectronic} onCheckedChange={(c) => setAgreeElectronic(c as boolean)} />
                      <label htmlFor="agreeElectronic" className="text-sm cursor-pointer flex-1 text-gray-700">
                        <span className="text-destructive">[필수]</span> 전자금융거래 이용약관
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="marketingOptIn" checked={marketingOptIn} onCheckedChange={(c) => setMarketingOptIn(c as boolean)} />
                      <label htmlFor="marketingOptIn" className="text-sm cursor-pointer flex-1 text-gray-500">
                        [선택] 마케팅 정보 수신 동의
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                    disabled={isLoading || !formValid}
                    onClick={handleSignup}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가입 처리 중...</>
                    ) : '가입 완료'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
