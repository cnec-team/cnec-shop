import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: '크넥샵 - 이제 공구는 판매만 하세요',
    template: '%s | 크넥샵',
  },
  description:
    'C/S부터 배송에 정산까지 원스톱으로. 크리에이터를 위한 공동구매 플랫폼 크넥샵',
  keywords: ['공동구매', '공구', '크리에이터', 'K-Beauty', 'Korean cosmetics', 'beauty', 'influencer', 'creator shop', 'group buy'],
  authors: [{ name: '크넥샵' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ja_JP', 'ko_KR'],
    siteName: '크넥샵',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
