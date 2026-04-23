import { CampaignListView } from '@/components/brand/campaigns/CampaignListView';

export default function AlwaysCampaignsPage() {
  return (
    <CampaignListView
      type="ALWAYS"
      title="상시 캠페인"
      subtitle="기간 제한 없이 크리에이터와 지속적으로 협업하세요"
      emptyTitle="아직 등록한 상시 캠페인이 없어요"
      emptyDescription={"첫 상시 캠페인을 만들고 크리에이터와\n지속적으로 협업을 시작해보세요"}
    />
  );
}
