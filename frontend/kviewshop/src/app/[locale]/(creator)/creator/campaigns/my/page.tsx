import { redirect } from 'next/navigation';

export default async function CreatorMyCampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/creator/campaigns`);
}
