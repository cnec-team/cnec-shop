export const COURIER_LABELS: Record<string, string> = {
  cj: 'CJ대한통운',
  hanjin: '한진택배',
  logen: '로젠택배',
  epost: '우체국택배',
  lotte: '롯데택배',
  etc: '기타',
};

export const COURIER_TRACKING_URL: Record<string, string> = {
  cj: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
  hanjin: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=&wblnum=',
  logen: 'https://www.ilogen.com/web/personal/trace/',
  epost: 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=',
  lotte: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=',
};

export function getTrackingUrl(courierCode: string | null, trackingNumber: string | null): string | null {
  if (!courierCode || !trackingNumber) return null;
  const baseUrl = COURIER_TRACKING_URL[courierCode];
  return baseUrl ? baseUrl + trackingNumber : null;
}

export function getCourierLabel(courierCode: string | null): string {
  return courierCode ? (COURIER_LABELS[courierCode] || courierCode) : '-';
}
