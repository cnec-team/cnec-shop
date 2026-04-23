import { Suspense } from 'react';
import { CampaignListView } from '@/components/brand/campaigns/CampaignListView';

export default function CampaignsPage() {
  return (
    <Suspense>
      <CampaignListView />
    </Suspense>
  );
}
