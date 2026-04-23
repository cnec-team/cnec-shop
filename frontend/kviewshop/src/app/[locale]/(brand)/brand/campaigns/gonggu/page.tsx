import { CampaignListView } from '@/components/brand/campaigns/CampaignListView';

export default function GongguCampaignsPage() {
  return (
    <CampaignListView
      type="GONGGU"
      title="캠페인 관리"
      subtitle="크리에이터와 함께하는 판매 파이프라인"
      emptyTitle="아직 등록한 캠페인이 없어요"
      emptyDescription={"첫 캠페인을 만들고 크리에이터와 함께\n판매를 시작해보세요"}
    />
  );
}
