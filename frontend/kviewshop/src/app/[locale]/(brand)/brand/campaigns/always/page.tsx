import { redirect } from 'next/navigation';

export default async function AlwaysRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/brand/campaigns?type=always`);
}
