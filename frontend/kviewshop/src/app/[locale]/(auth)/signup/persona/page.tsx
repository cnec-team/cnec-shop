'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { updateCreatorPersona } from '@/lib/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/store/auth';

type SkinType = 'combination' | 'dry' | 'oily' | 'normal' | 'oily_sensitive';
type PersonalColor = 'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool';
type AgeRange = '10s' | '20s_early' | '20s_late' | '30s_early' | '30s_late' | '40s_plus';
type BeautyInterest = 'skincare' | 'makeup' | 'body' | 'hair' | 'inner_beauty' | 'clean_beauty';

const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  combination: '복합성',
  dry: '건성',
  oily: '지성',
  normal: '중성',
  oily_sensitive: '수부지',
};

const PERSONAL_COLOR_LABELS: Record<PersonalColor, string> = {
  spring_warm: '봄웜',
  summer_cool: '여름쿨',
  autumn_warm: '가을웜',
  winter_cool: '겨울쿨',
};

const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  '10s': '10대',
  '20s_early': '20대 초반',
  '20s_late': '20대 후반',
  '30s_early': '30대 초반',
  '30s_late': '30대 후반',
  '40s_plus': '40대+',
};

const BEAUTY_INTEREST_LABELS: Record<BeautyInterest, string> = {
  skincare: '스킨케어',
  makeup: '메이크업',
  body: '바디',
  hair: '헤어',
  inner_beauty: '이너뷰티',
  clean_beauty: '클린뷰티',
};

const SKIN_CONCERN_OPTIONS = [
  { value: '모공', label: '모공', emoji: '🔍' },
  { value: '여드름', label: '여드름', emoji: '🔴' },
  { value: '주름', label: '주름', emoji: '〰️' },
  { value: '색소침착', label: '색소침착', emoji: '🟤' },
  { value: '건조', label: '건조', emoji: '🏜️' },
  { value: '민감', label: '민감', emoji: '⚡' },
];

const SKIN_TYPE_EMOJIS: Record<SkinType, string> = {
  combination: '🔄',
  dry: '🏜️',
  oily: '💧',
  normal: '✨',
  oily_sensitive: '⚡',
};

const PERSONAL_COLOR_EMOJIS: Record<PersonalColor, string> = {
  spring_warm: '🌸',
  summer_cool: '🌊',
  autumn_warm: '🍂',
  winter_cool: '❄️',
};

const BEAUTY_INTEREST_EMOJIS: Record<BeautyInterest, string> = {
  skincare: '🧴',
  makeup: '💄',
  body: '🛁',
  hair: '💇',
  inner_beauty: '💊',
  clean_beauty: '🌿',
};

const STEP_TITLES = [
  '피부 타입',
  '연령대',
  '피부 고민',
  '관심 카테고리',
  '퍼스널 컬러',
];

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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(SKIN_TYPE_LABELS) as SkinType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSkinType(type)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  skinType === type
                    ? 'border-pink-500 bg-pink-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/50'
                }`}
              >
                <span className="text-2xl">{SKIN_TYPE_EMOJIS[type]}</span>
                <span className="text-sm font-medium">{SKIN_TYPE_LABELS[type]}</span>
                {skinType === type && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        );

      case 1:
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(AGE_RANGE_LABELS) as AgeRange[]).map((age) => (
              <button
                key={age}
                onClick={() => setAgeRange(age)}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  ageRange === age
                    ? 'border-pink-500 bg-pink-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/50'
                }`}
              >
                <span className="text-sm font-medium">{AGE_RANGE_LABELS[age]}</span>
                {ageRange === age && (
                  <Check className="mx-auto mt-1 h-4 w-4 text-pink-500" />
                )}
              </button>
            ))}
          </div>
        );

      case 2:
        return (
          <div>
            <p className="mb-3 text-center text-sm text-gray-500">최대 3개 선택</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SKIN_CONCERN_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => handleConcernToggle(value)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    skinConcerns.includes(value)
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/50'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-medium">{label}</span>
                  {skinConcerns.includes(value) && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(BEAUTY_INTEREST_LABELS) as BeautyInterest[]).map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  interests.includes(interest)
                    ? 'border-pink-500 bg-pink-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/50'
                }`}
              >
                <span className="text-2xl">{BEAUTY_INTEREST_EMOJIS[interest]}</span>
                <span className="text-sm font-medium">{BEAUTY_INTEREST_LABELS[interest]}</span>
                {interests.includes(interest) && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PERSONAL_COLOR_LABELS) as PersonalColor[]).map((color) => (
              <button
                key={color}
                onClick={() => setPersonalColor(color)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${
                  personalColor === color
                    ? 'border-pink-500 bg-pink-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-50/50'
                }`}
              >
                <span className="text-3xl">{PERSONAL_COLOR_EMOJIS[color]}</span>
                <span className="text-sm font-medium">{PERSONAL_COLOR_LABELS[color]}</span>
                {personalColor === color && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">뷰티 페르소나</h1>
            <p className="mt-1 text-sm text-gray-500">
              나에게 맞는 상품을 추천받기 위한 필수 단계예요
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>Step {currentStep + 1} / 5</span>
              <span>{STEP_TITLES[currentStep]}</span>
            </div>
            <Progress value={(currentStep + 1) * 20} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="mb-6 min-h-[200px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                이전
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
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
        </CardContent>
      </Card>
    </div>
  );
}
