'use client';

import { useState } from 'react';
import { Loader2, Phone, CheckCircle2 } from 'lucide-react';

interface IdentityVerificationResult {
  phoneNumber: string;
  ci: string | null;
  verifiedAt: string;
  verificationToken: string;
}

interface IdentityVerificationButtonProps {
  name: string;
  onSuccess: (data: IdentityVerificationResult) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
}

export function IdentityVerificationButton({
  name,
  onSuccess,
  onError,
  disabled,
}: IdentityVerificationButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async () => {
    if (!name.trim()) {
      onError?.('이름을 먼저 입력해주세요');
      return;
    }

    setIsVerifying(true);
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY;

      if (!storeId || !channelKey) {
        onError?.('본인인증 설정이 완료되지 않았어요. 관리자에게 문의해주세요.');
        return;
      }

      const PortOne = await import('@portone/browser-sdk/v2');
      const identityVerificationId = `identity-${crypto.randomUUID()}`;

      const response = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId,
        channelKey,
        customer: { fullName: name },
      });

      if (response && 'code' in response && response.code !== undefined) {
        onError?.((response as { message?: string }).message || '본인인증에 실패했어요');
        return;
      }

      // 서버 검증
      const verifyRes = await fetch('/api/auth/verify-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityVerificationId }),
      });
      const result = await verifyRes.json();
      if (!verifyRes.ok) {
        onError?.(result.error || '인증 검증에 실패했어요');
        return;
      }

      setIsVerified(true);
      onSuccess(result);
    } catch (error) {
      console.error('Identity verification error:', error);
      onError?.('본인인증 중 오류가 발생했어요');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 rounded-xl bg-gray-200 px-5 h-12 text-sm font-medium text-gray-500 shrink-0"
      >
        <CheckCircle2 className="h-4 w-4" />
        인증완료
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleVerify}
      disabled={disabled || isVerifying || !name.trim()}
      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 h-12 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors shrink-0"
    >
      {isVerifying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          인증 중...
        </>
      ) : (
        <>
          <Phone className="h-4 w-4" />
          인증요청
        </>
      )}
    </button>
  );
}
