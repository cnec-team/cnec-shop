'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LegalFooter } from '@/components/shop/legal-footer';
import { Loader2, Mail, ChevronLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.includes('@')) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.status === 429) {
        setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      setSent(true);
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-4 pb-32">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Link
              href={`/${locale}/buyer/login`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" /> 로그인으로 돌아가기
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-2">이메일을 확인해주세요</h1>
                <p className="text-sm text-gray-600 mb-1">
                  비밀번호 재설정 링크를 보냈어요.
                </p>
                <p className="text-xs text-gray-400">
                  스팸함도 확인해주세요. 링크는 1시간 동안 유효합니다.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold">비밀번호 찾기</h1>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  가입하신 이메일을 입력하면 재설정 링크를 보내드려요
                </p>

                {error && (
                  <p className="text-sm text-destructive mb-4">{error}</p>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="email@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
                    disabled={isLoading || !email.includes('@')}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />발송 중...</>
                    ) : '재설정 링크 받기'}
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
