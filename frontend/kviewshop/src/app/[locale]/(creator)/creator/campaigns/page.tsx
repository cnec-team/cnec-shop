import { redirect } from 'next/navigation';

export default async function CreatorCampaignsRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/creator/campaigns/gonggu`);
}
