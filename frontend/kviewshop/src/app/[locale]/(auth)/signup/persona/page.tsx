'use client';

import { useState, type ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { updateCreatorPersona } from '@/lib/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Droplets,
  Sun,
  Repeat,
  Sparkles,
  Zap,
  Search,
  CircleDot,
  Waves,
  Palette,
  Flame,
  Pipette,
  Leaf,
  User,
  Pill,
  Cherry,
  Flower2,
  Snowflake,
  TreeDeciduous,
  ShowerHead,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

type SkinType = 'combination' | 'dry' | 'oily' | 'normal' | 'oily_sensitive';
type PersonalColor = 'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool';
type AgeRange = '10s' | '20s_early' | '20s_late' | '30s_early' | '30s_late' | '40s_plus';
type BeautyInterest = 'skincare' | 'makeup' | 'body' | 'hair' | 'inner_beauty' | 'clean_beauty';

// ─── Constants ───────────────────────────────────────────────────────────────

const SKIN_TYPE_OPTIONS: { value: SkinType; label: string; icon: ReactNode }[] = [
  { value: 'oily', label: '지성', icon: <Droplets className="h-6 w-6" /> },
  { value: 'dry', label: '건성', icon: <Sun className="h-6 w-6" /> },
  { value: 'combination', label: '복합성', icon: <Repeat className="h-6 w-6" /> },
  { value: 'normal', label: '중성', icon: <Sparkles className="h-6 w-6" /> },
  { value: 'oily_sensitive', label: '수부지', icon: <Zap className="h-6 w-6" /> },
];

const AGE_RANGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: '10s', label: '10대' },
  { value: '20s_early', label: '20대 초반' },
  { value: '20s_late', label: '20대 후반' },
  { value: '30s_early', label: '30대 초반' },
  { value: '30s_late', label: '30대 후반' },
  { value: '40s_plus', label: '40대+' },
];

const SKIN_CONCERN_OPTIONS: { value: string; label: string; icon: ReactNode }[] = [
  { value: '모공', label: '모공', icon: <Search className="h-6 w-6" /> },
  { value: '여드름', label: '여드름', icon: <CircleDot className="h-6 w-6" /> },
  { value: '주름', label: '주름', icon: <Waves className="h-6 w-6" /> },
  { value: '색소침착', label: '색소침착', icon: <Palette className="h-6 w-6" /> },
  { value: '건조', label: '건조', icon: <Sun className="h-6 w-6" /> },
  { value: '민감', label: '민감', icon: <Flame className="h-6 w-6" /> },
];

const BEAUTY_INTEREST_OPTIONS: { value: BeautyInterest; label: string; icon: ReactNode }[] = [
  { value: 'skincare', label: '스킨케어', icon: <Pipette className="h-6 w-6" /> },
  { value: 'makeup', label: '메이크업', icon: <Palette className="h-6 w-6" /> },
  { value: 'body', label: '바디', icon: <ShowerHead className="h-6 w-6" /> },
  { value: 'hair', label: '헤어', icon: <User className="h-6 w-6" /> },
  { value: 'inner_beauty', label: '이너뷰티', icon: <Pill className="h-6 w-6" /> },
  { value: 'clean_beauty', label: '클린뷰티', icon: <Leaf className="h-6 w-6" /> },
];

const PERSONAL_COLOR_OPTIONS: {
  value: PersonalColor;
  label: string;
  sub: string;
  icon: ReactNode;
  gradient: string;
}[] = [
  {
    value: 'spring_warm',
    label: '봄웜',
    sub: 'Spring Warm',
    icon: <Cherry className="h-7 w-7" />,
    gradient: 'from-rose-100 to-amber-100',
  },
  {
    value: 'summer_cool',
    label: '여름쿨',
    sub: 'Summer Cool',
    icon: <Flower2 className="h-7 w-7" />,
    gradient: 'from-sky-100 to-pink-100',
  },
  {
    value: 'autumn_warm',
    label: '가을웜',
    sub: 'Autumn Warm',
    icon: <TreeDeciduous className="h-7 w-7" />,
    gradient: 'from-amber-100 to-orange-100',
  },
  {
    value: 'winter_cool',
    label: '겨울쿨',
    sub: 'Winter Cool',
    icon: <Snowflake className="h-7 w-7" />,
    gradient: 'from-indigo-100 to-slate-100',
  },
];

const STEP_TITLES = ['피부 타입', '연령대', '피부 고민', '관심 카테고리', '퍼스널 컬러'];
const STEP_DESCRIPTIONS = [
  '나의 피부 타입을 선택해주세요',
  '연령대를 선택해주세요',
  '고민되는 피부 문제를 선택해주세요 (최대 3개)',
  '관심있는 뷰티 카테고리를 선택해주세요',
  '나에게 어울리는 컬러 타입을 선택해주세요',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PersonaQuizPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { creator, setCreator } = useAuthStore();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selections
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [interests, setInterests] = useState<BeautyInterest[]>([]);
  const [personalColor, setPersonalColor] = useState<PersonalColor | null>(null);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return skinType !== null;
      case 1: return ageRange !== null;
      case 2: return skinConcerns.length > 0;
      case 3: return interests.length > 0;
      case 4: return personalColor !== null;
      default: return false;
    }
  };

  const handleConcernToggle = (concern: string) => {
    setSkinConcerns(prev => {
      if (prev.includes(concern)) {
        return prev.filter(c => c !== concern);
      }
      if (prev.length >= 3) {
        toast.error('최대 3개까지 선택할 수 있습니다');
        return prev;
      }
      return [...prev, concern];
    });
  };

  const handleInterestToggle = (interest: BeautyInterest) => {
    setInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      return [...prev, interest];
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!skinType || !ageRange || !personalColor) return;

    if (!session?.user) {
      toast.error('로그인이 필요합니다');
      router.push(`/${locale}/login`);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCreatorPersona({
        skinType,
        ageRange,
        skinConcerns,
        interests,
        personalColor,
      });

      // Update local store
      if (creator) {
        setCreator({
          ...creator,
          skin_type: skinType,
          age_range: ageRange,
          skin_concerns: skinConcerns,
          interests: interests,
          personal_color: personalColor,
        });
      }

      router.push(`/${locale}/signup/complete`);
    } catch (error) {
      console.error('Persona submit error:', error);
      toast.error('오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      // Step 0: Skin Type
      case 0:
        return (
          <div className="grid grid-cols-3 gap-3">
            {SKIN_TYPE_OPTIONS.map(({ value, label, icon }) => {
              const selected = skinType === value;
              return (
                <button
                  key={value}
                  onClick={() => setSkinType(value)}
                  aria-selected={selected}
                  className={`relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all duration-200 ${
                    selected
                      ? 'border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-400/30 ring-offset-2 scale-[1.03]'
                      : 'border-gray-100 bg-white shadow-sm hover:border-pink-200 hover:shadow-md'
                  }`}
                >
                  <div className={`${selected ? 'text-pink-500' : 'text-gray-500'} transition-colors duration-200`}>
                    {icon}
                  </div>
                  <span className={`text-sm font-semibold ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {label}
                  </span>
                  {selected && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      // Step 1: Age Range
      case 1:
        return (
          <div className="grid grid-cols-3 gap-3">
            {AGE_RANGE_OPTIONS.map(({ value, label }) => {
              const selected = ageRange === value;
              return (
                <button
                  key={value}
                  onClick={() => setAgeRange(value)}
                  aria-selected={selected}
                  className={`relative flex items-center justify-center rounded-2xl border-2 px-3 py-4 transition-all duration-200 ${
                    selected
                      ? 'border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-400/30 ring-offset-2 scale-[1.03]'
                      : 'border-gray-100 bg-white shadow-sm hover:border-pink-200 hover:shadow-md'
                  }`}
                >
                  <span className={`text-sm font-semibold ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {label}
                  </span>
                  {selected && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      // Step 2: Skin Concerns (multi-select, max 3)
      case 2:
        return (
          <div>
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">최대 3개 선택</span>
              {skinConcerns.length > 0 && (
                <Badge variant="secondary" className="bg-pink-100 text-pink-600 hover:bg-pink-100">
                  {skinConcerns.length}/3
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SKIN_CONCERN_OPTIONS.map(({ value, label, icon }) => {
                const selected = skinConcerns.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => handleConcernToggle(value)}
                    aria-selected={selected}
                    className={`relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all duration-200 ${
                      selected
                        ? 'border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-400/30 ring-offset-2 scale-[1.03]'
                        : 'border-gray-100 bg-white shadow-sm hover:border-pink-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`${selected ? 'text-pink-500' : 'text-gray-500'} transition-colors duration-200`}>
                      {icon}
                    </div>
                    <span className={`text-sm font-semibold ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    {selected && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Step 3: Beauty Interests (multi-select)
      case 3:
        return (
          <div>
            {interests.length > 0 && (
              <div className="mb-3 flex justify-center">
                <Badge variant="secondary" className="bg-pink-100 text-pink-600 hover:bg-pink-100">
                  {interests.length}개 선택됨
                </Badge>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {BEAUTY_INTEREST_OPTIONS.map(({ value, label, icon }) => {
                const selected = interests.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => handleInterestToggle(value)}
                    aria-selected={selected}
                    className={`relative flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all duration-200 ${
                      selected
                        ? 'border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-400/30 ring-offset-2 scale-[1.03]'
                        : 'border-gray-100 bg-white shadow-sm hover:border-pink-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`${selected ? 'text-pink-500' : 'text-gray-500'} transition-colors duration-200`}>
                      {icon}
                    </div>
                    <span className={`text-sm font-semibold ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    {selected && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Step 4: Personal Color
      case 4:
        return (
          <div className="grid grid-cols-2 gap-3">
            {PERSONAL_COLOR_OPTIONS.map(({ value, label, sub, icon, gradient }) => {
              const selected = personalColor === value;
              return (
                <button
                  key={value}
                  onClick={() => setPersonalColor(value)}
                  aria-selected={selected}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all duration-200 ${
                    selected
                      ? 'border-pink-400 shadow-md ring-2 ring-pink-400/30 ring-offset-2 scale-[1.03]'
                      : 'border-gray-100 shadow-sm hover:border-pink-200 hover:shadow-md'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}>
                    <div className={`${selected ? 'text-pink-600' : 'text-gray-600'} transition-colors duration-200`}>
                      {icon}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">{sub}</span>
                  {selected && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Main layout ─────────────────────────────────────────────────────────

  const progressPercent = ((currentStep + 1) / 5) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
            뷰티 페르소나
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            나에게 맞는 상품을 추천받기 위한 필수 단계예요
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[#666666]">
              Step {currentStep + 1} / 5
            </span>
            <span className="text-xs font-medium text-pink-500">
              {STEP_TITLES[currentStep]}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Title & Description */}
        <div className="mb-5 text-center">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{STEP_TITLES[currentStep]}</h2>
          <p className="mt-1 text-sm text-[#666666]">{STEP_DESCRIPTIONS[currentStep]}</p>
        </div>

        {/* Card Container */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 rounded-full border-gray-200 py-6 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 py-6 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-all duration-200 hover:from-pink-600 hover:to-purple-600 hover:shadow-xl hover:shadow-pink-500/30 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : currentStep === 4 ? (
              <>
                완료
                <Check className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                다음
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
