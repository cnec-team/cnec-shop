declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

export function initKakao(): boolean {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key || typeof window === 'undefined' || !window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(key);
  }
  return true;
}

export function sendKakaoShare({
  title,
  description,
  imageUrl,
  linkUrl,
}: {
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
}) {
  if (!initKakao() || !window.Kakao) return false;

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: imageUrl || '',
      link: {
        mobileWebUrl: linkUrl,
        webUrl: linkUrl,
      },
    },
    buttons: [
      {
        title: '구경하기',
        link: {
          mobileWebUrl: linkUrl,
          webUrl: linkUrl,
        },
      },
    ],
  });
  return true;
}
