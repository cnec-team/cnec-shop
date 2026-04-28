'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
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
  Instagram,
  Youtube,
  AlignLeft,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PhoneVerificationInput } from '@/components/auth/PhoneVerificationInput';
import { IdentityVerificationButton } from '@/components/auth/IdentityVerificationButton';

const portoneIdentityEnabled = Boolean(
  process.env.NEXT_PUBLIC_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY
);

type Role = 'creator' | 'brand_admin';

// ── Categories ──
const MAIN_CATEGORIES = [
  '스킨케어', '메이크업', '헤어', '네일', '이너뷰티', '뷰티디바이스',
] as const;

const SUB_CATEGORIES: Record<string, string[]> = {
  '스킨케어': ['토너', '세럼', '크림', '마스크팩', '선케어', '클렌징'],
  '메이크업': ['베이스', '립', '아이', '치크', '브러시/툴'],
  '헤어': ['샴푸', '트리트먼트', '에센스', '스타일링', '염색'],
  '네일': ['매니큐어', '젤네일', '네일아트', '케어'],
  '이너뷰티': ['콜라겐', '비타민', '유산균', '다이어트'],
  '뷰티디바이스': ['피부관리기', '헤어기기', 'LED마스크'],
};

// ── Helpers ──
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

// ── Step labels (새 순서) ──
// 크리에이터: 계정설정(1) → 프로필(2) → 카테고리(3) → 본인확인(4) → 약관(5)
// 브랜드:     계정설정(1) → 브랜드(2) → 본인확인(3) → 약관(4)
const CREATOR_STEPS = ['계정설정', '프로필', '카테고리', '본인확인', '약관'];
const BRAND_STEPS = ['계정설정', '브랜드', '본인확인', '약관'];

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
  const [socialMode, setSocialMode] = useState(false);
  const { status: sessionStatus } = useSession();

  useEffect(() => {
    if (roleParam === 'brand_admin' || roleParam === 'creator') {
      setRole(roleParam);
      const stepParam = searchParams.get('step');
      const socialParam = searchParams.get('social');
      if (socialParam === '1' && stepParam) {
        if (sessionStatus === 'loading') return;
        if (sessionStatus === 'unauthenticated') {
          toast.error('소셜 로그인에 실패했습니다. 다시 시도해주세요.');
          setStep(1);
          return;
        }
        setStep(parseInt(stepParam, 10));
        setSocialMode(true);
      } else {
        setStep(1);
      }
    }
  }, [roleParam, searchParams, sessionStatus]);

  // 소셜 가입 에러 메시지 처리
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (!errorParam) return;
    const errorMessages: Record<string, string> = {
      verification_required: '본인인증이 필요합니다. 다시 시도해주세요.',
      verification_expired: '인증 정보가 만료되었습니다. 다시 인증해주세요.',
      already_registered: '이미 가입된 사용자입니다.',
      email_exists: '이미 사용 중인 이메일입니다.',
    };
    if (errorMessages[errorParam]) {
      toast.error(errorMessages[errorParam]);
    }
  }, [searchParams]);

  // Step 1: 계정설정 (이메일/비밀번호)
  const [email, setEmail] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 Creator: 크리에이터 프로필
  const [displayName, setDisplayName] = useState('');
  const [shopId, setShopId] = useState('');
  const [shopIdAvailable, setShopIdAvailable] = useState<boolean | null>(null);
  const [shopIdChecking, setShopIdChecking] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [youtubeHandle, setYoutubeHandle] = useState('');
  const [bio, setBio] = useState('');

  // Step 2 Brand: 브랜드 정보
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');

  // Step 3 Creator: 카테고리
  const [primaryCategory, setPrimaryCategory] = useState('');
  const [subCategories, setSubCategories] = useState<string[]>([]);

  // Step 4 (본인확인) - creator: step 4, brand: step 3
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  // 약관 (creator: step 5, brand: step 4)
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [termsModal, setTermsModal] = useState<'terms' | 'privacy' | null>(null);

  // Auto-toggle "agree all"
  useEffect(() => {
    if (agreeAge && agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeAge, agreeTerms, agreePrivacy, agreeMarketing]);

  function handleAgreeAll(checked: boolean) {
    setAgreeAll(checked);
    setAgreeAge(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  }

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

  function toggleSubCategory(cat: string) {
    setSubCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  // 단계 계산
  const totalSteps = role === 'creator' ? 5 : 4;
  const termsStep = role === 'creator' ? 5 : 4;
  const verificationStep = role === 'creator' ? 4 : 3;
  const categoryStep = role === 'creator' ? 3 : -1;
  const stepLabels = role === 'creator' ? CREATOR_STEPS : BRAND_STEPS;

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: {
        // 계정설정: 이메일 + 비밀번호 (소셜 모드에서는 건너뜀)
        if (socialMode) return true;
        const pwValid = password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
        return email.includes('@') && emailAvailable === true && pwValid && password === confirmPassword;
      }
      case 2:
        if (role === 'brand_admin') return companyName.length >= 1;
        // 크리에이터 프로필
        return displayName.length >= 1 && shopId.length >= 2 && shopIdAvailable === true;
      case 3:
        if (role === 'creator') return primaryCategory.length > 0; // 카테고리
        // 브랜드 본인확인
        return name.length >= 2 && phoneVerified;
      case 4:
        if (role === 'creator') return name.length >= 2 && phoneVerified; // 크리에이터 본인확인
        return agreeAge && agreeTerms && agreePrivacy; // 브랜드 약관
      case 5:
        return agreeAge && agreeTerms && agreePrivacy; // 크리에이터 약관
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        email,
        password,
        name,
        role,
        phone: phoneNumber.replace(/-/g, ''),
        verificationToken: verificationToken || undefined,
        refCode: refCode || undefined,
        termsAgreedAt: now,
        privacyAgreedAt: now,
        marketingAgreedAt: agreeMarketing ? now : undefined,
      };

      if (role === 'brand_admin') {
        payload.companyName = companyName;
        payload.businessNumber = businessNumber.replace(/-/g, '');
      } else {
        payload.displayName = displayName;
        payload.shopId = shopId;
        payload.instagramHandle = instagramHandle || undefined;
        payload.tiktok = tiktokHandle || undefined;
        payload.youtube = youtubeHandle || undefined;
        payload.bio = bio || undefined;
        payload.primaryCategory = primaryCategory || undefined;
        payload.categories = subCategories.length > 0 ? subCategories : undefined;
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

  const handleSocialSubmit = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        displayName,
        shopId,
        instagramHandle: instagramHandle || undefined,
        tiktok: tiktokHandle || undefined,
        youtube: youtubeHandle || undefined,
        bio: bio || undefined,
        primaryCategory: primaryCategory || undefined,
        categories: subCategories.length > 0 ? subCategories : undefined,
        termsAgreedAt: now,
        privacyAgreedAt: now,
        marketingAgreedAt: agreeMarketing ? now : undefined,
        refCode: refCode || undefined,
        // 본인확인 데이터 포함
        verificationToken: verificationToken || undefined,
        name: name || undefined,
      };

      const res = await fetch('/api/auth/complete-social-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '프로필 저장에 실패했습니다');
        return;
      }

      router.push(`/${locale}/signup/persona`);
      router.refresh();
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === termsStep) {
      if (socialMode) {
        handleSocialSubmit();
      } else {
        handleSubmit();
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (socialMode && step <= 2) {
      setStep(0);
      setSocialMode(false);
      return;
    }
    setStep(s => s - 1);
  };

  // 크리에이터 소셜 가입 (Step 1에서 바로 진행 - 본인인증 불필요)
  function handleCreatorSocialLogin(provider: string) {
    document.cookie = `signup_role=creator;path=/;max-age=600;samesite=lax`;
    // 본인인증은 step 4에서 진행하므로 verification_token 없이 진행
    signIn(provider, { callbackUrl: `/${locale}/signup?role=creator&step=2&social=1` });
  }

  const subtitle = role === 'brand_admin' ? '브랜드 파트너스 가입' : '크리에이터 가입';

  // Input classes
  const inputCls = 'w-full h-[52px] rounded-xl bg-gray-50 border border-gray-200 text-[15px] pl-11 pr-4 placeholder:text-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-colors';
  const inputClsWithRight = 'w-full h-[52px] rounded-xl bg-gray-50 border border-gray-200 text-[15px] pl-11 pr-12 placeholder:text-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-colors';

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="flex flex-col items-center pt-8 sm:pt-12 pb-8 px-4">
        {/* 로고 */}
        <Link href={`/${locale}`} className="mb-2">
          <span className="text-[22px] font-bold text-gray-900 tracking-tight">CNEC Shop</span>
        </Link>
        {step > 0 && (
          <p className="text-[14px] text-gray-500 mb-4">{subtitle}</p>
        )}

        {/* Card */}
        <div className="w-full max-w-md">
          {step === 0 ? (
            /* ─── Step 0: 역할 선택 ─── */
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-[22px] font-bold text-gray-900 text-center mb-1.5">시작하기</h2>
              <p className="text-[14px] text-gray-500 text-center mb-8">어떤 역할로 가입하시겠어요?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('brand_admin')}
                  className={`flex flex-col items-center rounded-xl border-2 p-5 transition-all ${
                    role === 'brand_admin'
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-7 w-7 mb-2.5" />
                  <span className="font-semibold text-[15px]">브랜드</span>
                  <span className={`text-[12px] mt-1 ${role === 'brand_admin' ? 'text-gray-300' : 'text-gray-400'}`}>상품 등록 & 판매</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`flex flex-col items-center rounded-xl border-2 p-5 transition-all ${
                    role === 'creator'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Sparkles className="h-7 w-7 mb-2.5" />
                  <span className="font-semibold text-[15px]">크리에이터</span>
                  <span className={`text-[12px] mt-1 ${role === 'creator' ? 'text-blue-200' : 'text-gray-400'}`}>내 셀렉트샵 시작</span>
                </button>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full h-[52px] rounded-xl font-semibold text-[15px] transition-all bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.995] mt-8"
              >
                다음
              </button>

              <div className="text-center text-[14px] mt-6">
                <span className="text-gray-400">이미 계정이 있으신가요? </span>
                <Link href={`/${locale}/login`} className="text-gray-900 font-medium hover:underline">로그인</Link>
              </div>
            </div>
          ) : (
            /* ─── Step 1+: 위자드 카드 ─── */
            <div className="bg-white rounded-2xl shadow-sm">
              {/* ── 프로그레스 바 ── */}
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors -ml-1"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-500" />
                  </button>
                  <span className="text-[13px] text-gray-400">{step}/{totalSteps}</span>
                  <div className="w-9" />
                </div>
                <div className="flex items-center gap-1">
                  {stepLabels.map((label, i) => {
                    const stepNum = i + 1;
                    const isActive = step === stepNum;
                    const isDone = step > stepNum;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-1 rounded-full transition-all duration-300 ${
                          isDone ? 'bg-blue-500' : isActive ? 'bg-blue-500' : 'bg-gray-200'
                        }`} />
                        <div className="flex items-center gap-0.5">
                          {isDone && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                          <span className={`text-[10px] sm:text-[11px] transition-colors ${
                            isActive ? 'text-blue-600 font-semibold' : isDone ? 'text-blue-400' : 'text-gray-300'
                          }`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Form Content ── */}
              <div className="px-6 pb-4 pt-4">
                {/* ═══ Step 1: 계정설정 (이메일/비밀번호 + 소셜) ═══ */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
                      간편하게 시작하세요
                    </h2>

                    {/* 소셜 가입 버튼 (크리에이터 전용) */}
                    {role === 'creator' && (
                      <>
                        <div className="space-y-2.5">
                          <button
                            type="button"
                            onClick={() => handleCreatorSocialLogin('kakao')}
                            className="relative w-full h-[52px] rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:brightness-[0.97] active:scale-[0.995] transition-all"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.37.32.67.65.47l4.96-3.26c.37.04.74.06 1.13.06 5.52 0 10-3.36 10-7.44C22 6.36 17.52 3 12 3z"/></svg>
                            카카오로 시작하기
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-[#191919]/10 rounded-full px-2 py-0.5">간편 가입</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreatorSocialLogin('naver')}
                            className="w-full h-[52px] rounded-xl bg-[#03C75A] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:brightness-[0.95] active:scale-[0.995] transition-all"
                          >
                            <span className="font-bold text-[18px] leading-none">N</span>
                            네이버로 시작하기
                          </button>
                        </div>
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-[12px] text-gray-400">또는 이메일로 가입</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      </>
                    )}

                    {role === 'brand_admin' && (
                      <p className="text-[14px] text-gray-500 -mt-2">로그인에 사용할 정보를 입력해주세요</p>
                    )}

                    <div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value.trim().toLowerCase())} placeholder="이메일" className={inputClsWithRight} />
                        {!emailChecking && emailAvailable === true && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                        {!emailChecking && emailAvailable === false && <X className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />}
                        {emailChecking && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />}
                      </div>
                      {emailAvailable === false && <p className="text-red-500 text-[13px] mt-1.5 ml-1">이미 사용 중인 이메일이에요</p>}
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 (8자 이상 영문, 숫자 조합)" className={inputClsWithRight} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="비밀번호 확인" className={inputClsWithRight} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && <p className="text-red-500 text-[13px] -mt-2 ml-1">비밀번호가 일치하지 않아요</p>}
                  </div>
                )}

                {/* ═══ Step 2 Creator: 프로필 + SNS ═══ */}
                {step === 2 && role === 'creator' && (
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight whitespace-pre-line">
                      {'크리에이터 정보를\n알려주세요'}
                    </h2>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="닉네임 / 활동명" className={inputCls} />
                    </div>

                    <div>
                      <div className="relative">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                        <input type="text" value={shopId} onChange={e => handleShopIdChange(e.target.value)} placeholder="shop-id" maxLength={30} className={inputClsWithRight} />
                        {!shopIdChecking && shopIdAvailable === true && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                        {!shopIdChecking && shopIdAvailable === false && <X className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />}
                        {shopIdChecking && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />}
                      </div>
                      {shopIdAvailable === false && <p className="text-red-500 text-[13px] mt-1 ml-1">이미 사용 중인 ID예요</p>}
                      <p className="text-[12px] text-gray-400 mt-1 ml-1">cnecshop.com/{shopId || 'shop-id'}</p>
                    </div>

                    {/* Instagram */}
                    <div className="relative">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value.replace(/^@/, ''))} placeholder="인스타그램 ID" className={inputCls} />
                    </div>

                    <p className="text-[12px] text-gray-400 -mb-2">선택 입력</p>

                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .54.04.79.1V9.01c-.26-.04-.52-.06-.79-.06a6.33 6.33 0 0 0-6.33 6.33A6.33 6.33 0 0 0 9.49 21.6a6.33 6.33 0 0 0 6.33-6.33V8.73a8.23 8.23 0 0 0 4.82 1.55V6.83c-.35 0-.7-.05-1.05-.14Z"/></svg>
                      <input type="text" value={tiktokHandle} onChange={e => setTiktokHandle(e.target.value.replace(/^@/, ''))} placeholder="TikTok ID (선택)" className={inputCls} />
                    </div>

                    <div className="relative">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type="text" value={youtubeHandle} onChange={e => setYoutubeHandle(e.target.value)} placeholder="YouTube 채널명 (선택)" className={inputCls} />
                    </div>

                    <div>
                      <div className="relative">
                        <AlignLeft className="absolute left-4 top-3.5 h-[18px] w-[18px] text-gray-400" />
                        <textarea
                          value={bio}
                          onChange={e => setBio(e.target.value.slice(0, 50))}
                          placeholder="한 줄 소개 (선택)"
                          rows={2}
                          className="w-full rounded-xl bg-gray-50 border border-gray-200 text-[15px] pl-11 pr-4 pt-3 pb-3 placeholder:text-gray-400 focus:bg-white focus:border-gray-900 focus:ring-0 outline-none transition-colors resize-none"
                        />
                      </div>
                      <p className="text-[12px] text-gray-400 text-right mt-0.5">{bio.length}/50</p>
                    </div>
                  </div>
                )}

                {/* ═══ Step 2 Brand: 브랜드 정보 ═══ */}
                {step === 2 && role === 'brand_admin' && (
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight whitespace-pre-line">
                      {'브랜드 정보를\n알려주세요'}
                    </h2>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="회사명 (예: 주식회사 크넥)" className={inputCls} />
                    </div>
                    <div>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                        <input type="text" value={businessNumber} onChange={e => setBusinessNumber(formatBusinessNumber(e.target.value))} placeholder="사업자번호 (선택)" className={inputCls} />
                      </div>
                      <p className="text-[12px] text-gray-400 mt-1 ml-1">사업자 번호 10자리를 입력해주세요</p>
                    </div>
                  </div>
                )}

                {/* ═══ Step 3 Creator: 카테고리 선택 ═══ */}
                {step === categoryStep && role === 'creator' && (
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight whitespace-pre-line">
                      {'어떤 분야\n크리에이터인가요?'}
                    </h2>
                    <p className="text-[14px] text-gray-500 -mt-2">심사에 참고됩니다</p>

                    <div>
                      <p className="text-[14px] font-medium text-gray-700 mb-2">메인 카테고리</p>
                      <div className="grid grid-cols-3 gap-2">
                        {MAIN_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { setPrimaryCategory(cat); setSubCategories([]); }}
                            className={`rounded-xl py-3 px-2 text-[14px] font-medium transition-all ${
                              primaryCategory === cat
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {primaryCategory && SUB_CATEGORIES[primaryCategory] && (
                      <div>
                        <p className="text-[14px] font-medium text-gray-700 mb-2">상세 카테고리 <span className="text-gray-400 font-normal">(복수 선택 가능)</span></p>
                        <div className="flex flex-wrap gap-2">
                          {SUB_CATEGORIES[primaryCategory].map(sub => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleSubCategory(sub)}
                              className={`rounded-full px-4 py-2 text-[14px] transition-all ${
                                subCategories.includes(sub)
                                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {subCategories.includes(sub) && <Check className="inline h-3 w-3 mr-1" />}
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ 본인확인 (Creator: step 4, Brand: step 3) ═══ */}
                {step === verificationStep && (
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight whitespace-pre-line">
                      {role === 'brand_admin' ? '담당자 정보를\n확인할게요' : '마지막으로\n본인 확인이 필요해요'}
                    </h2>
                    <p className="text-[14px] text-gray-500 -mt-2">안전한 서비스 이용을 위해 확인합니다</p>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름 (실명)" className={inputCls} />
                    </div>

                    {/* 크리에이터: PortOne 본인인증 or SMS / 브랜드: SMS */}
                    {role === 'creator' && portoneIdentityEnabled ? (
                      <div className="flex gap-2 items-start">
                        <div className="relative flex-1">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                          <input type="tel" value={phoneNumber} disabled placeholder="본인인증 시 자동 입력" className={`${inputCls} disabled:opacity-60`} />
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
                    ) : (
                      <div className="flex gap-2 items-start">
                        <div className="relative flex-1">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                          <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(formatPhone(e.target.value))} placeholder="010-0000-0000" disabled={phoneVerified} className={`${inputCls} disabled:opacity-60`} />
                        </div>
                        <PhoneVerificationInput
                          phoneNumber={phoneNumber}
                          disabled={phoneVerified}
                          onVerified={(data) => {
                            setPhoneNumber(formatPhone(data.phoneNumber));
                            setPhoneVerified(true);
                            setVerificationToken(data.verificationToken);
                            toast.success('휴대폰 인증이 완료되었습니다');
                          }}
                          onError={(msg) => toast.error(msg)}
                        />
                      </div>
                    )}

                    {phoneVerified && (
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl p-3.5 text-[14px]">
                        <Check className="h-4 w-4 shrink-0" />
                        휴대폰 인증이 완료되었습니다
                      </div>
                    )}
                  </div>
                )}

                {/* ═══ 약관 (Creator: step 5, Brand: step 4) ═══ */}
                {step === termsStep && (
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
                      거의 다 왔어요!
                    </h2>
                    <p className="text-[14px] text-gray-500 -mt-2">서비스 이용을 위해 동의가 필요해요</p>

                    {/* 전체 동의 */}
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer border border-gray-200">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        agreeAll ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {agreeAll && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={agreeAll} onChange={e => handleAgreeAll(e.target.checked)} />
                      <span className="font-semibold text-gray-900 text-[15px]">전체 동의</span>
                    </label>

                    <div className="border-t border-gray-100" />

                    {[
                      { id: 'age', label: '만 14세 이상입니다', required: true, checked: agreeAge, onChange: setAgreeAge },
                      { id: 'terms', label: '이용약관 동의', required: true, checked: agreeTerms, onChange: setAgreeTerms, link: `/${locale}/terms` },
                      { id: 'privacy', label: '개인정보 수집·이용 동의', required: true, checked: agreePrivacy, onChange: setAgreePrivacy, link: `/${locale}/privacy` },
                      { id: 'marketing', label: '마케팅 정보 수신 동의', required: false, checked: agreeMarketing, onChange: setAgreeMarketing },
                    ].map(item => (
                      <label key={item.id} className="flex items-center gap-3 py-1 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                          {item.checked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={item.checked} onChange={e => item.onChange(e.target.checked)} />
                        <span className="flex-1 text-[14px] text-gray-700">
                          <span className={item.required ? 'text-blue-600' : 'text-gray-400'}>[{item.required ? '필수' : '선택'}]</span>{' '}
                          {item.label}
                        </span>
                        {item.link && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTermsModal(item.id as 'terms' | 'privacy'); }}
                            className="text-[12px] text-gray-400 underline shrink-0"
                          >
                            전문보기
                          </button>
                        )}
                      </label>
                    ))}

                    {canProceed() && (
                      <div className="bg-blue-50 rounded-xl p-3.5 text-[14px] text-blue-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0" />
                        가입 완료 시 축하 3,000원이 지급돼요!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sticky CTA ── */}
              <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 rounded-b-2xl" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || isLoading}
                  className={`w-full h-[52px] rounded-xl font-semibold text-[15px] transition-all active:scale-[0.995] ${
                    canProceed() && !isLoading
                      ? step === termsStep
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      처리 중...
                    </span>
                  ) : step === termsStep ? (
                    '가입 신청하기'
                  ) : (
                    '다음'
                  )}
                </button>

                <div className="text-center text-[14px] mt-4">
                  <span className="text-gray-400">이미 계정이 있으신가요? </span>
                  <Link href={`/${locale}/login`} className="text-gray-900 font-medium hover:underline">로그인</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Terms Modal ── */}
      {termsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setTermsModal(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-[17px]">
                {termsModal === 'terms' ? '이용약관' : '개인정보 수집·이용 동의'}
              </h3>
              <button type="button" onClick={() => setTermsModal(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <iframe
                src={termsModal === 'terms' ? `/${locale}/terms` : `/${locale}/privacy`}
                className="w-full min-h-[50vh] border-0"
                title={termsModal === 'terms' ? '이용약관' : '개인정보처리방침'}
              />
            </div>
            <div className="p-4 border-t">
              <button
                type="button"
                onClick={() => {
                  if (termsModal === 'terms') setAgreeTerms(true);
                  else setAgreePrivacy(true);
                  setTermsModal(null);
                }}
                className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
