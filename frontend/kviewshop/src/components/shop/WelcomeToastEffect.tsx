'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function WelcomeToastEffect() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // 서버가 세팅한 welcome_new_signup 쿠키 확인
    const cookies = document.cookie.split('; ');
    const welcomeCookie = cookies.find(c => c.startsWith('welcome_new_signup='));

    if (welcomeCookie) {
      toast.success('가입 축하드려요! 3,000P가 지급됐어요', {
        duration: 5000,
      });
      document.cookie = 'welcome_new_signup=; Max-Age=0; path=/';
      return;
    }

    // Credentials 가입은 sessionStorage로 설정됨
    const flag = sessionStorage.getItem('welcomeToast');
    if (flag === '1') {
      toast.success('가입 축하드려요! 3,000P가 지급됐어요', {
        duration: 5000,
      });
      sessionStorage.removeItem('welcomeToast');
    }
  }, [session]);

  return null;
}
