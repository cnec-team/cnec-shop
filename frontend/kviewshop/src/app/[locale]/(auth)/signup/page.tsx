'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Loader2,
  Building2,
  Sparkles,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Lock,
  FileText,
  Check,
  X,
  AtSign,
} from 'lucide-react';
import { IdentityVerificationButton } from '@/components/auth/IdentityVerificationButton';

type Role = 'creator' | 'brand_admin';

function formatPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
}

function formatBusinessNumber(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 10);
  if (nums.length <= 3) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5)}`;
}

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const refCode = searchParams.get('ref');
  const roleParam = searchParams.get('role') as Role | null;

  // Step 0 = role selection (skipped if roleParam present)
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(
    roleParam === 'brand_admin' || roleParam === 'creator' ? roleParam : 'creator',
  );
  const [isLoading, setIsLoading] = useState(false);

  // Skip step 0 if role from query
  useEffect(() => {
    if (roleParam === 'brand_admin' || roleParam === 'creator') {
      setRole(roleParam);
      setStep(1);
    }
  }, [roleParam]);

  // Step 1: 담당자 정보
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  // Step 2: 로그인 정보
  const [email, setEmail] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3 Brand: 브랜드 정보
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');

  // Step 3 Creator: 크리에이터 프로필
  const [displayName, setDisplayName] = useState('');
  const [shopId, setShopId] = useState('');
  const [shopIdAvailable, setShopIdAvailable] = useState<boolean | null>(null);
  const [shopIdChecking, setShopIdChecking] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState('');

  // Email debounce check
  useEffect(() => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailAvailable(null);
      return;
    }
    setEmailChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setEmailAvailable(data.available);
      } catch {
        setEmailAvailable(null);
      } finally {
        setEmailChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  // Shop ID debounce check
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
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setShopId(cleaned.slice(0, 30));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return name.length >= 2 && phoneVerified;
      case 2:
        const pwValid = password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
        return email.includes('@') && emailAvailable === true && pwValid && password === confirmPassword;
      case 3:
        if (role === 'brand_admin') return companyName.length >= 1;
        return displayName.length >= 1 && shopId.length >= 2 && shopIdAvailable === true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload: Record<string, string | undefined> = {
        email,
        password,
        name,
        role,
        phone: phoneNumber.replace(/-/g, ''),
        verificationToken: verificationToken || undefined,
        refCode: refCode || undefined,
      };

      if (role === 'brand_admin') {
        payload.companyName = companyName;
        payload.businessNumber = businessNumber.replace(/-/g, '');
      } else {
        payload.displayName = displayName;
        payload.shopId = shopId;
        payload.instagramHandle = instagramHandle || undefined;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '회원가입에 실패했습니다');
        return;
      }

      // 자동 로그인
      const signInResult = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.success('계정이 생성되었습니다. 로그인해주세요.');
        router.push(`/${locale}/login`);
        return;
      }

      if (role === 'brand_admin') {
        toast.success('브랜드 등록이 완료되었습니다');
        router.push(`/${locale}/brand/dashboard`);
      } else {
        router.push(`/${locale}/signup/persona`);
      }
      router.refresh();
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const subtitle = role === 'brand_admin' ? '브랜드 파트너스 가입' : '크리에이터 가입';
  const currentDot = step === 0 ? 0 : step - 1; // 0-indexed for 3 dots

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center pt-8 sm:pt-12 pb-8 px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="mb-2">
          <span className="text-2xl font-bold text-gray-900">CNEC Shop</span>
        </Link>
        {step > 0 && (
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
        )}

        {/* Card */}
        <div className="w-full max-w-md">
          {step === 0 ? (
            /* ─── Step 0: Role Selection ─── */
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">시작하기</h2>
              <p className="text-sm text-gray-500 text-center mb-8">어떤 역할로 가입하시겠어요?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('brand_admin')}
                  className={`flex flex-col items-center rounded-2xl border-2 p-6 transition-all ${
                    role === 'brand_admin'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-8 w-8 mb-3" />
                  <span className="font-semibold">브랜드</span>
                  <span className={`text-xs mt-1 ${role === 'brand_admin' ? 'text-gray-300' : 'text-gray-400'}`}>상품 등록 & 판매</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`flex flex-col items-center rounded-2xl border-2 p-6 transition-all ${
                    role === 'creator'
                      ? 'border-blue-600 bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Sparkles className="h-8 w-8 mb-3" />
                  <span className="font-semibold">크리에이터</span>
                  <span className={`text-xs mt-1 ${role === 'creator' ? 'text-blue-200' : 'text-gray-400'}`}>내 셀렉트샵 시작</span>
                </button>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full h-14 rounded-2xl bg-blue-600 text-white font-semibold text-base mt-8 hover:bg-blue-700 transition-colors"
              >
                다음
              </button>

              <div className="text-center text-sm mt-6">
                <span className="text-gray-500">이미 계정이 있으신가요? </span>
                <Link href={`/${locale}/login`} className="text-blue-600 font-medium hover:underline">로그인</Link>
              </div>
            </div>
          ) : (
            /* ─── Step 1-3: Wizard Card ─── */
            <div className="bg-white rounded-3xl shadow-sm p-8">
              {/* Top bar: Back + Progress dots */}
              <div className="flex items-center justify-between mb-8">
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors -ml-2"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentDot
                          ? 'w-8 h-2 bg-blue-600'
                          : i < currentDot
                          ? 'w-2 h-2 bg-blue-300'
                          : 'w-2 h-2 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="w-10" />
              </div>

              {/* Step 1: 담당자 정보 + 인증 */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {role === 'brand_admin' ? '담당자 정보를\n확인할게요' : '본인 정보를\n확인할게요'}
                  </h2>

                  {/* 이름 */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="이름"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* 휴대폰 + 인증 */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(formatPhone(e.target.value))}
                        placeholder="010-0000-0000"
                        disabled={phoneVerified}
                        className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition-all"
                      />
                    </div>
                    <IdentityVerificationButton
                      name={name}
                      disabled={phoneVerified}
                      onSuccess={(data) => {
                        setPhoneNumber(formatPhone(data.phoneNumber));
                        setPhoneVerified(true);
                        setVerificationToken(data.verificationToken);
                        toast.success('본인인증이 완료되었습니다');
                      }}
                      onError={(msg) => toast.error(msg)}
                    />
                  </div>

                  {phoneVerified && (
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-2xl p-4 text-sm">
                      <Check className="h-4 w-4 shrink-0" />
                      휴대폰 인증이 완료되었습니다
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: 로그인 정보 */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight whitespace-pre-line">
                    {'로그인에 사용할\n정보를 입력해주세요'}
                  </h2>

                  {/* 이메일 */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value.trim().toLowerCase())}
                      placeholder="이메일"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-12 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {!emailChecking && emailAvailable === true && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                    {!emailChecking && emailAvailable === false && (
                      <X className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                    )}
                    {emailChecking && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                    )}
                  </div>
                  {emailAvailable === false && (
                    <p className="text-red-500 text-sm -mt-3 ml-1">이미 사용 중인 이메일이에요</p>
                  )}

                  {/* 비밀번호 */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="8자 이상 영문, 숫자 조합"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* 비밀번호 확인 */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="비밀번호를 한번 더 입력해주세요"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-sm -mt-3 ml-1">비밀번호가 일치하지 않아요</p>
                  )}
                </div>
              )}

              {/* Step 3 Brand: 브랜드 정보 */}
              {step === 3 && role === 'brand_admin' && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight whitespace-pre-line">
                    {'마지막으로\n브랜드 정보를 알려주세요'}
                  </h2>

                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="주식회사 크넥"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={businessNumber}
                        onChange={e => setBusinessNumber(formatBusinessNumber(e.target.value))}
                        placeholder="000-00-00000"
                        className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">사업자 번호 10자리를 입력해주세요</p>
                  </div>
                </div>
              )}

              {/* Step 3 Creator: 크리에이터 프로필 */}
              {step === 3 && role === 'creator' && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight whitespace-pre-line">
                    {'크리에이터 정보를\n알려주세요'}
                  </h2>

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="닉네임 / 활동명"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={shopId}
                        onChange={e => handleShopIdChange(e.target.value)}
                        placeholder="shop-id"
                        maxLength={30}
                        className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-12 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      {!shopIdChecking && shopIdAvailable === true && (
                        <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                      {!shopIdChecking && shopIdAvailable === false && (
                        <X className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                      )}
                      {shopIdChecking && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                      )}
                    </div>
                    {shopIdAvailable === false && (
                      <p className="text-red-500 text-sm mt-1 ml-1">이미 사용 중인 ID예요</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 ml-1">영문 소문자, 숫자, 밑줄(_)만 사용 가능</p>
                  </div>

                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={e => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                      placeholder="인스타그램 ID (선택)"
                      className="w-full h-14 rounded-2xl bg-gray-50 border-0 text-base pl-12 pr-5 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || isLoading}
                className={`w-full h-14 rounded-2xl font-semibold text-base mt-8 transition-colors ${
                  canProceed() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-200 text-white cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    처리 중...
                  </span>
                ) : step === 3 ? (
                  role === 'brand_admin' ? '크넥샵 시작하기' : '크리에이터 시작하기'
                ) : (
                  '다음'
                )}
              </button>

              <div className="text-center text-sm mt-6">
                <span className="text-gray-500">이미 계정이 있으신가요? </span>
                <Link href={`/${locale}/login`} className="text-blue-600 font-medium hover:underline">로그인</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
