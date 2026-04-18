'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LegalFooter } from '@/components/shop/legal-footer';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!passwordValid || !passwordsMatch || !token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          invalid_token: '유효하지 않은 링크입니다.',
          token_used: '이미 사용된 링크입니다.',
          token_expired: '만료된 링크입니다. 다시 요청해주세요.',
          password_requirements: '비밀번호는 8자 이상, 영문+숫자 포함이어야 합니다.',
        };
        setError(messages[data.error] || '오류가 발생했습니다.');
        return;
      }

      setDone(true);
      toast.success('비밀번호가 변경되었습니다');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">유효하지 않은 링크입니다.</p>
            <Link href={`/${locale}/buyer/forgot-password`} className="text-primary hover:underline">
              비밀번호 찾기로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-4 pb-32">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {done ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-2">비밀번호 변경 완료</h1>
                <p className="text-sm text-gray-600 mb-4">
                  새 비밀번호로 로그인해주세요
                </p>
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                  onClick={() => router.push(`/${locale}/buyer/login`)}
                >
                  로그인하기
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold">새 비밀번호 설정</h1>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  새로운 비밀번호를 입력해주세요
                </p>

                {error && (
                  <p className="text-sm text-destructive mb-4">{error}</p>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-semibold">새 비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="새 비밀번호"
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

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold">비밀번호 확인</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="비밀번호 다시 입력"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                    disabled={isLoading || !passwordValid || !passwordsMatch}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />변경 중...</>
                    ) : '비밀번호 변경'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <LegalFooter locale={locale} variant="minimal" />
    </div>
  );
}
