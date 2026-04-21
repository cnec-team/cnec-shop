import { CampaignListView } from '@/components/brand/campaigns/CampaignListView';

export default function AlwaysCampaignsPage() {
  return (
    <CampaignListView
      type="ALWAYS"
      title="상시 캠페인"
      subtitle="기간 제한 없이 크리에이터와 지속적으로 협업하세요"
      emptyTitle="상시 캠페인을 시작해보세요"
      emptyDescription={"기간 제한 없이 크리에이터와\n지속적으로 협업할 수 있어요"}
    />
  );
}
