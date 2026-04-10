import { redirect } from 'next/navigation';

// 배너 관리 기능은 현재 미사용 — 대시보드로 리다이렉트
export default async function CreatorBannersRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/creator/dashboard`);
}
