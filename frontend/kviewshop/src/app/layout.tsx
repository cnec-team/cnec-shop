import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

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
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
