import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface IngredientData {
  koName: string;
  enName: string;
  tier: string;
  category: string;
  trendScore: number;
  evidenceLevel: string;
  description: string;
  sideEffects: string | null;
  pregnancySafe: boolean;
  efficacyP01: number; // 여드름·트러블
  efficacyP02: number; // 모공
  efficacyP03: number; // 기미·잡티·색소침착
  efficacyP04: number; // 주름·탄력
  efficacyP05: number; // 건조·보습
  efficacyP06: number; // 민감·자극
  efficacyP07: number; // 장벽 손상
  efficacyP08: number; // 유분·블랙헤드
}

// K-뷰티 성분 100개 효능 벡터 (임상/학술 근거 기반)
const INGREDIENTS: IngredientData[] = [
  // ============== Tier S (30개) ==============
  {
    koName: "PDRN", enName: "Polydeoxyribonucleotide", tier: "S", category: "재생",
    trendScore: 95, evidenceLevel: "high",
    description: "연어 DNA 유래 재생 성분으로, 세포 증식 촉진과 조직 복구에 탁월한 효과를 보입니다.",
    sideEffects: "고농도 사용 시 자극 가능, 어류 알레르기 주의", pregnancySafe: false,
    efficacyP01: 0.3, efficacyP02: 0.2, efficacyP03: 0.4, efficacyP04: 0.9, efficacyP05: 0.5, efficacyP06: 0.4, efficacyP07: 0.9, efficacyP08: 0.1,
  },
  {
    koName: "엑소좀", enName: "Exosome", tier: "S", category: "재생",
    trendScore: 98, evidenceLevel: "medium",
    description: "세포 간 신호전달 물질로, 피부 재생과 항염 효과가 있습니다.",
    sideEffects: "일부 민감 피부에 초기 자극 가능", pregnancySafe: false,
    efficacyP01: 0.4, efficacyP02: 0.3, efficacyP03: 0.5, efficacyP04: 0.85, efficacyP05: 0.5, efficacyP06: 0.6, efficacyP07: 0.9, efficacyP08: 0.1,
  },
  {
    koName: "나이아신아마이드", enName: "Niacinamide", tier: "S", category: "미백",
    trendScore: 92, evidenceLevel: "high",
    description: "비타민 B3 유도체로, 미백, 모공 축소, 피지 조절 등 다기능 효과가 있습니다.",
    sideEffects: "5% 이상 고농도에서 일부 자극 가능", pregnancySafe: true,
    efficacyP01: 0.5, efficacyP02: 0.7, efficacyP03: 0.85, efficacyP04: 0.5, efficacyP05: 0.4, efficacyP06: 0.3, efficacyP07: 0.3, efficacyP08: 0.6,
  },
  {
    koName: "히알루론산", enName: "Hyaluronic Acid", tier: "S", category: "보습",
    trendScore: 90, evidenceLevel: "high",
    description: "피부 자체 보습인자로, 자기 무게의 1000배 수분을 끌어당기는 강력 보습 성분입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.2, efficacyP03: 0.1, efficacyP04: 0.4, efficacyP05: 0.95, efficacyP06: 0.3, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "세라마이드", enName: "Ceramide", tier: "S", category: "장벽",
    trendScore: 88, evidenceLevel: "high",
    description: "피부 장벽의 핵심 지질 성분으로, 수분 손실 방지와 장벽 강화에 필수적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.2, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.3, efficacyP05: 0.8, efficacyP06: 0.7, efficacyP07: 0.9, efficacyP08: 0.1,
  },
  {
    koName: "펩타이드", enName: "Peptide", tier: "S", category: "안티에이징",
    trendScore: 87, evidenceLevel: "high",
    description: "아미노산 결합체로, 콜라겐 합성 촉진과 주름 개선에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.2, efficacyP03: 0.2, efficacyP04: 0.9, efficacyP05: 0.4, efficacyP06: 0.3, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "센텔라", enName: "Centella Asiatica", tier: "S", category: "진정",
    trendScore: 85, evidenceLevel: "high",
    description: "병풀 유래 진정 성분으로, 피부 재생과 염증 완화에 다방면으로 쓰입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.7, efficacyP02: 0.3, efficacyP03: 0.2, efficacyP04: 0.4, efficacyP05: 0.3, efficacyP06: 0.85, efficacyP07: 0.8, efficacyP08: 0.2,
  },
  {
    koName: "레티놀", enName: "Retinol", tier: "S", category: "안티에이징",
    trendScore: 93, evidenceLevel: "high",
    description: "비타민 A 유도체로, 세포 턴오버 촉진과 콜라겐 생성으로 주름 개선에 골드 스탠다드입니다.",
    sideEffects: "자극, 건조, 각질, 광과민성. 초기 레티노이드 반응 가능", pregnancySafe: false,
    efficacyP01: 0.6, efficacyP02: 0.7, efficacyP03: 0.7, efficacyP04: 0.95, efficacyP05: 0.1, efficacyP06: 0.1, efficacyP07: 0.2, efficacyP08: 0.5,
  },
  {
    koName: "판테놀", enName: "Panthenol", tier: "S", category: "진정",
    trendScore: 82, evidenceLevel: "high",
    description: "프로비타민 B5로, 보습과 진정, 피부 장벽 회복에 효과적인 만능 성분입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.8, efficacyP06: 0.8, efficacyP07: 0.85, efficacyP08: 0.1,
  },
  {
    koName: "비타민C", enName: "Ascorbic Acid", tier: "S", category: "미백",
    trendScore: 91, evidenceLevel: "high",
    description: "강력한 항산화제로, 멜라닌 생성 억제와 콜라겐 합성 촉진 효과가 있습니다.",
    sideEffects: "고농도(15%+) 사용 시 자극, 산화 불안정성", pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.3, efficacyP03: 0.9, efficacyP04: 0.7, efficacyP05: 0.2, efficacyP06: 0.2, efficacyP07: 0.3, efficacyP08: 0.2,
  },
  {
    koName: "트라넥삼산", enName: "Tranexamic Acid", tier: "S", category: "미백",
    trendScore: 86, evidenceLevel: "high",
    description: "기미 치료 성분으로, 멜라닌 전달 차단과 색소침착 개선에 뛰어납니다.",
    sideEffects: "경구 복용 시 혈전 위험(외용은 안전)", pregnancySafe: false,
    efficacyP01: 0.2, efficacyP02: 0.1, efficacyP03: 0.95, efficacyP04: 0.2, efficacyP05: 0.1, efficacyP06: 0.3, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "갈락토미세스", enName: "Galactomyces", tier: "S", category: "발효",
    trendScore: 80, evidenceLevel: "medium",
    description: "효모 발효 여과물로, 피부결 개선과 톤업, 보습에 복합 효과가 있습니다.",
    sideEffects: "말라세지아 피부염 유발 가능성(지루성 피부)", pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.5, efficacyP03: 0.6, efficacyP04: 0.4, efficacyP05: 0.6, efficacyP06: 0.3, efficacyP07: 0.3, efficacyP08: 0.3,
  },
  {
    koName: "달팽이 점액", enName: "Snail Mucin", tier: "S", category: "재생",
    trendScore: 84, evidenceLevel: "medium",
    description: "달팽이 분비물로, 알란토인과 글리코산 등이 포함되어 피부 재생과 보습에 효과적입니다.",
    sideEffects: "달팽이 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.5, efficacyP02: 0.3, efficacyP03: 0.4, efficacyP04: 0.6, efficacyP05: 0.7, efficacyP06: 0.5, efficacyP07: 0.7, efficacyP08: 0.2,
  },
  {
    koName: "마데카소사이드", enName: "Madecassoside", tier: "S", category: "진정",
    trendScore: 83, evidenceLevel: "high",
    description: "센텔라 아시아티카의 핵심 활성 성분으로, 강력한 항염과 상처 치유 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.7, efficacyP02: 0.2, efficacyP03: 0.3, efficacyP04: 0.3, efficacyP05: 0.3, efficacyP06: 0.9, efficacyP07: 0.85, efficacyP08: 0.2,
  },
  {
    koName: "아줄렌", enName: "Azulene", tier: "S", category: "진정",
    trendScore: 78, evidenceLevel: "medium",
    description: "캐모마일 유래 청색 성분으로, 항염과 진정 효과가 뛰어납니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.6, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.3, efficacyP06: 0.9, efficacyP07: 0.7, efficacyP08: 0.1,
  },
  {
    koName: "스쿠알란", enName: "Squalane", tier: "S", category: "보습",
    trendScore: 79, evidenceLevel: "high",
    description: "인체 피지와 유사한 오일 성분으로, 가벼운 보습과 장벽 보호 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.3, efficacyP05: 0.85, efficacyP06: 0.5, efficacyP07: 0.6, efficacyP08: 0.1,
  },
  {
    koName: "알부틴", enName: "Arbutin", tier: "S", category: "미백",
    trendScore: 76, evidenceLevel: "high",
    description: "하이드로퀴논의 안전한 유도체로, 티로시나제 억제를 통해 멜라닌 생성을 차단합니다.",
    sideEffects: "고농도에서 드물게 자극", pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.9, efficacyP04: 0.1, efficacyP05: 0.1, efficacyP06: 0.2, efficacyP07: 0.1, efficacyP08: 0.1,
  },
  {
    koName: "AHA", enName: "Alpha Hydroxy Acid", tier: "S", category: "각질",
    trendScore: 82, evidenceLevel: "high",
    description: "글리콜산, 락틱산 등 수용성 각질 제거제로, 피부결 개선과 톤업 효과가 있습니다.",
    sideEffects: "농도에 따라 자극, 광과민성 증가", pregnancySafe: false,
    efficacyP01: 0.5, efficacyP02: 0.7, efficacyP03: 0.6, efficacyP04: 0.5, efficacyP05: 0.1, efficacyP06: 0.1, efficacyP07: 0.1, efficacyP08: 0.6,
  },
  {
    koName: "BHA", enName: "Beta Hydroxy Acid", tier: "S", category: "모공",
    trendScore: 85, evidenceLevel: "high",
    description: "살리실산 기반 지용성 각질 제거제로, 모공 깊숙이 침투하여 블랙헤드를 녹입니다.",
    sideEffects: "건조, 자극 가능. 아스피린 알레르기 주의", pregnancySafe: false,
    efficacyP01: 0.8, efficacyP02: 0.9, efficacyP03: 0.3, efficacyP04: 0.2, efficacyP05: 0.05, efficacyP06: 0.1, efficacyP07: 0.1, efficacyP08: 0.85,
  },
  {
    koName: "PHA", enName: "Polyhydroxy Acid", tier: "S", category: "각질",
    trendScore: 75, evidenceLevel: "medium",
    description: "글루코노락톤 등 대분자 각질 제거제로, AHA보다 자극이 적어 민감 피부에도 사용 가능합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.5, efficacyP03: 0.4, efficacyP04: 0.3, efficacyP05: 0.3, efficacyP06: 0.5, efficacyP07: 0.3, efficacyP08: 0.4,
  },
  {
    koName: "콜라겐", enName: "Collagen", tier: "S", category: "안티에이징",
    trendScore: 80, evidenceLevel: "medium",
    description: "피부 구조 단백질로, 외용 시 보습 효과가 주이며 탄력 개선 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.7, efficacyP05: 0.7, efficacyP06: 0.2, efficacyP07: 0.4, efficacyP08: 0.1,
  },
  {
    koName: "티트리", enName: "Tea Tree", tier: "S", category: "진정",
    trendScore: 81, evidenceLevel: "high",
    description: "항균, 항염 성분으로, 여드름균 억제에 임상적으로 검증된 천연 성분입니다.",
    sideEffects: "원액 사용 시 접촉성 피부염 가능", pregnancySafe: false,
    efficacyP01: 0.9, efficacyP02: 0.4, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.1, efficacyP06: 0.3, efficacyP07: 0.2, efficacyP08: 0.5,
  },
  {
    koName: "프로폴리스", enName: "Propolis", tier: "S", category: "진정",
    trendScore: 79, evidenceLevel: "medium",
    description: "꿀벌이 만드는 천연 항균 물질로, 진정과 영양 공급, 상처 치유에 효과적입니다.",
    sideEffects: "꿀벌 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.7, efficacyP02: 0.2, efficacyP03: 0.2, efficacyP04: 0.3, efficacyP05: 0.5, efficacyP06: 0.6, efficacyP07: 0.5, efficacyP08: 0.2,
  },
  {
    koName: "시카", enName: "Cica", tier: "S", category: "진정",
    trendScore: 86, evidenceLevel: "high",
    description: "센텔라 아시아티카 복합체로, 진정과 장벽 회복에 K-뷰티 대표 성분입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.65, efficacyP02: 0.2, efficacyP03: 0.2, efficacyP04: 0.3, efficacyP05: 0.4, efficacyP06: 0.85, efficacyP07: 0.8, efficacyP08: 0.15,
  },
  {
    koName: "어성초", enName: "Houttuynia Cordata", tier: "S", category: "진정",
    trendScore: 74, evidenceLevel: "medium",
    description: "한방 약재로, 항균과 항염 효과가 있어 트러블 진정에 사용됩니다.",
    sideEffects: "특유의 향, 드물게 알레르기", pregnancySafe: true,
    efficacyP01: 0.8, efficacyP02: 0.3, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.2, efficacyP06: 0.7, efficacyP07: 0.4, efficacyP08: 0.3,
  },
  {
    koName: "바쿠치올", enName: "Bakuchiol", tier: "S", category: "안티에이징",
    trendScore: 88, evidenceLevel: "high",
    description: "레티놀 대체 식물성 성분으로, 주름 개선과 탄력에 효과적이면서 자극이 적습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.4, efficacyP03: 0.5, efficacyP04: 0.85, efficacyP05: 0.3, efficacyP06: 0.5, efficacyP07: 0.3, efficacyP08: 0.3,
  },
  {
    koName: "EGF", enName: "Epidermal Growth Factor", tier: "S", category: "재생",
    trendScore: 77, evidenceLevel: "high",
    description: "표피세포 성장인자로, 세포 증식과 상처 치유를 촉진합니다.",
    sideEffects: "피부암 이력자 사용 주의(이론적 우려)", pregnancySafe: false,
    efficacyP01: 0.3, efficacyP02: 0.2, efficacyP03: 0.3, efficacyP04: 0.85, efficacyP05: 0.3, efficacyP06: 0.3, efficacyP07: 0.85, efficacyP08: 0.1,
  },
  {
    koName: "NMN", enName: "Nicotinamide Mononucleotide", tier: "S", category: "안티에이징",
    trendScore: 82, evidenceLevel: "medium",
    description: "NAD+ 전구체로, 세포 에너지 대사와 DNA 복구를 통한 안티에이징 신성분입니다.",
    sideEffects: null, pregnancySafe: false,
    efficacyP01: 0.2, efficacyP02: 0.2, efficacyP03: 0.3, efficacyP04: 0.8, efficacyP05: 0.3, efficacyP06: 0.3, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "스핑고지질", enName: "Sphingolipid", tier: "S", category: "장벽",
    trendScore: 72, evidenceLevel: "high",
    description: "피부 장벽 구성 지질로, 세라마이드와 함께 장벽 복구의 핵심 역할을 합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.7, efficacyP06: 0.6, efficacyP07: 0.85, efficacyP08: 0.1,
  },
  {
    koName: "홍삼", enName: "Red Ginseng", tier: "S", category: "안티에이징",
    trendScore: 75, evidenceLevel: "medium",
    description: "한방 대표 성분으로, 항산화와 혈행 개선, 피부 톤업에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.2, efficacyP02: 0.2, efficacyP03: 0.4, efficacyP04: 0.7, efficacyP05: 0.4, efficacyP06: 0.3, efficacyP07: 0.3, efficacyP08: 0.2,
  },
  // ============== Tier A (40개) ==============
  {
    koName: "알란토인", enName: "Allantoin", tier: "A", category: "진정",
    trendScore: 65, evidenceLevel: "high",
    description: "컴프리 유래 진정 성분으로, 세포 증식 촉진과 자극 완화에 널리 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.4, efficacyP06: 0.8, efficacyP07: 0.7, efficacyP08: 0.1,
  },
  {
    koName: "알로에", enName: "Aloe Vera", tier: "A", category: "진정",
    trendScore: 70, evidenceLevel: "high",
    description: "수분 공급과 진정, 소염 효과가 있는 대중적인 천연 보습 성분입니다.",
    sideEffects: "드물게 접촉성 피부염", pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.7, efficacyP06: 0.7, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "글리세린", enName: "Glycerin", tier: "A", category: "보습",
    trendScore: 60, evidenceLevel: "high",
    description: "기본 보습제로, 수분을 끌어당기고 유지하는 검증된 보습 성분입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.05, efficacyP03: 0.05, efficacyP04: 0.1, efficacyP05: 0.9, efficacyP06: 0.3, efficacyP07: 0.4, efficacyP08: 0.05,
  },
  {
    koName: "아데노신", enName: "Adenosine", tier: "A", category: "안티에이징",
    trendScore: 72, evidenceLevel: "high",
    description: "식약처 인증 주름개선 기능성 성분으로, 콜라겐 합성을 촉진합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.85, efficacyP05: 0.2, efficacyP06: 0.2, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "살리실산", enName: "Salicylic Acid", tier: "A", category: "모공",
    trendScore: 78, evidenceLevel: "high",
    description: "BHA의 대표 성분으로, 모공 내 피지를 녹이고 여드름균을 억제합니다.",
    sideEffects: "건조, 자극 가능. 아스피린 알레르기 주의", pregnancySafe: false,
    efficacyP01: 0.85, efficacyP02: 0.9, efficacyP03: 0.2, efficacyP04: 0.1, efficacyP05: 0.05, efficacyP06: 0.1, efficacyP07: 0.1, efficacyP08: 0.85,
  },
  {
    koName: "코엔자임Q10", enName: "Coenzyme Q10", tier: "A", category: "안티에이징",
    trendScore: 62, evidenceLevel: "medium",
    description: "세포 에너지 생성에 관여하는 항산화 성분으로, 노화 방지 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.2, efficacyP04: 0.7, efficacyP05: 0.3, efficacyP06: 0.2, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "비타민E", enName: "Tocopherol", tier: "A", category: "보습",
    trendScore: 65, evidenceLevel: "high",
    description: "지용성 항산화 비타민으로, 피부 보호와 보습, 상처 치유에 효과적입니다.",
    sideEffects: "고농도에서 드물게 접촉성 피부염", pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.2, efficacyP04: 0.5, efficacyP05: 0.7, efficacyP06: 0.3, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "리포좀 비타민C", enName: "Liposomal Vitamin C", tier: "A", category: "미백",
    trendScore: 74, evidenceLevel: "medium",
    description: "리포좀 캡슐화로 안정성과 침투력을 높인 비타민C 제형입니다.",
    sideEffects: "일반 비타민C보다 자극 적음", pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.3, efficacyP03: 0.85, efficacyP04: 0.6, efficacyP05: 0.2, efficacyP06: 0.3, efficacyP07: 0.3, efficacyP08: 0.2,
  },
  {
    koName: "아세틸헥사펩타이드", enName: "Acetyl Hexapeptide", tier: "A", category: "안티에이징",
    trendScore: 68, evidenceLevel: "medium",
    description: "보톡스 유사 펩타이드(아르지렐린)로, 표정 주름 완화에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.9, efficacyP05: 0.2, efficacyP06: 0.2, efficacyP07: 0.2, efficacyP08: 0.05,
  },
  {
    koName: "코지산", enName: "Kojic Acid", tier: "A", category: "미백",
    trendScore: 64, evidenceLevel: "high",
    description: "곰팡이 발효 유래 미백 성분으로, 티로시나제 억제를 통해 색소침착을 개선합니다.",
    sideEffects: "접촉성 피부염, 광과민성 가능", pregnancySafe: false,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.85, efficacyP04: 0.1, efficacyP05: 0.1, efficacyP06: 0.15, efficacyP07: 0.1, efficacyP08: 0.1,
  },
  {
    koName: "감초추출물", enName: "Licorice Extract", tier: "A", category: "진정",
    trendScore: 66, evidenceLevel: "high",
    description: "글라브리딘 함유로, 미백과 항염, 진정 효과가 복합적으로 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.1, efficacyP03: 0.7, efficacyP04: 0.1, efficacyP05: 0.2, efficacyP06: 0.7, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "녹차추출물", enName: "Green Tea Extract", tier: "A", category: "진정",
    trendScore: 72, evidenceLevel: "high",
    description: "EGCG 등 카테킨이 풍부한 항산화 성분으로, 피지 조절과 항염에 효과적입니다.",
    sideEffects: "카페인에 민감한 경우 주의", pregnancySafe: true,
    efficacyP01: 0.5, efficacyP02: 0.4, efficacyP03: 0.3, efficacyP04: 0.4, efficacyP05: 0.3, efficacyP06: 0.5, efficacyP07: 0.3, efficacyP08: 0.5,
  },
  {
    koName: "자작나무수액", enName: "Birch Sap", tier: "A", category: "보습",
    trendScore: 68, evidenceLevel: "medium",
    description: "미네랄과 아미노산이 풍부한 자연 수분 공급원으로, 피부에 생기를 줍니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.2, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.8, efficacyP06: 0.3, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "참나무추출물", enName: "Oak Extract", tier: "A", category: "진정",
    trendScore: 45, evidenceLevel: "low",
    description: "탄닌이 풍부하여 수렴과 항산화 효과가 있는 전통 원료입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.3, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.2, efficacyP06: 0.4, efficacyP07: 0.2, efficacyP08: 0.3,
  },
  {
    koName: "콩기름", enName: "Soybean Oil", tier: "A", category: "보습",
    trendScore: 40, evidenceLevel: "medium",
    description: "레시틴과 이소플라본이 함유된 식물성 오일로, 보습과 피부 연화에 효과적입니다.",
    sideEffects: "콩 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.05, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.7, efficacyP06: 0.2, efficacyP07: 0.3, efficacyP08: 0.05,
  },
  {
    koName: "호호바오일", enName: "Jojoba Oil", tier: "A", category: "보습",
    trendScore: 65, evidenceLevel: "medium",
    description: "피지와 유사한 왁스 에스테르로, 유수분 밸런스 조절과 모공 막힘 없는 보습이 가능합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.2, efficacyP03: 0.05, efficacyP04: 0.2, efficacyP05: 0.8, efficacyP06: 0.4, efficacyP07: 0.4, efficacyP08: 0.2,
  },
  {
    koName: "카카두자두", enName: "Kakadu Plum", tier: "A", category: "미백",
    trendScore: 70, evidenceLevel: "medium",
    description: "세계에서 비타민C 함량이 가장 높은 과일 추출물로, 강력한 항산화와 미백 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.2, efficacyP02: 0.2, efficacyP03: 0.8, efficacyP04: 0.5, efficacyP05: 0.3, efficacyP06: 0.2, efficacyP07: 0.2, efficacyP08: 0.15,
  },
  {
    koName: "에델바이스", enName: "Edelweiss", tier: "A", category: "안티에이징",
    trendScore: 55, evidenceLevel: "medium",
    description: "고산 식물 추출물로, UV 보호와 항산화 효과가 뛰어납니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.3, efficacyP04: 0.6, efficacyP05: 0.3, efficacyP06: 0.4, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "자운고", enName: "Zi Yun Gao", tier: "A", category: "진정",
    trendScore: 58, evidenceLevel: "medium",
    description: "한방 연고 처방으로, 상처 치유와 피부 재생, 진정에 전통적으로 사용됩니다.",
    sideEffects: "특유의 향과 색", pregnancySafe: false,
    efficacyP01: 0.5, efficacyP02: 0.1, efficacyP03: 0.2, efficacyP04: 0.2, efficacyP05: 0.4, efficacyP06: 0.6, efficacyP07: 0.7, efficacyP08: 0.1,
  },
  {
    koName: "마유", enName: "Horse Oil", tier: "A", category: "보습",
    trendScore: 60, evidenceLevel: "low",
    description: "말기름으로, 인체 피지와 유사한 지방산 조성으로 빠른 흡수와 보습이 가능합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.3, efficacyP05: 0.8, efficacyP06: 0.4, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "베타글루칸", enName: "Beta-Glucan", tier: "A", category: "장벽",
    trendScore: 72, evidenceLevel: "high",
    description: "효모/버섯 유래 다당체로, 면역 강화와 진정, 장벽 복구에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.3, efficacyP05: 0.6, efficacyP06: 0.7, efficacyP07: 0.8, efficacyP08: 0.1,
  },
  {
    koName: "하이드록시시코아민", enName: "Hydroxycinnamic Acid", tier: "A", category: "항산화",
    trendScore: 42, evidenceLevel: "medium",
    description: "페룰산 등 폴리페놀 계열 항산화제로, UV 보호와 활성산소 중화에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.4, efficacyP04: 0.5, efficacyP05: 0.1, efficacyP06: 0.2, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "유칼립투스", enName: "Eucalyptus", tier: "A", category: "진정",
    trendScore: 50, evidenceLevel: "medium",
    description: "항균, 소염 효과가 있는 허브 추출물로, 청량감과 피지 조절에 사용됩니다.",
    sideEffects: "민감 피부 자극 가능", pregnancySafe: false,
    efficacyP01: 0.5, efficacyP02: 0.3, efficacyP03: 0.05, efficacyP04: 0.05, efficacyP05: 0.1, efficacyP06: 0.3, efficacyP07: 0.2, efficacyP08: 0.4,
  },
  {
    koName: "카렌듈라", enName: "Calendula", tier: "A", category: "진정",
    trendScore: 62, evidenceLevel: "medium",
    description: "금잔화 추출물로, 진정과 항염, 상처 치유에 전통적으로 사용되는 성분입니다.",
    sideEffects: "국화과 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.4, efficacyP06: 0.75, efficacyP07: 0.6, efficacyP08: 0.1,
  },
  {
    koName: "우엉추출물", enName: "Burdock Extract", tier: "A", category: "진정",
    trendScore: 48, evidenceLevel: "low",
    description: "항산화와 항염 효과가 있으며, 두피와 피부 진정에 사용되는 한방 원료입니다.",
    sideEffects: "국화과 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.2, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.2, efficacyP06: 0.5, efficacyP07: 0.3, efficacyP08: 0.3,
  },
  {
    koName: "인삼", enName: "Ginseng", tier: "A", category: "안티에이징",
    trendScore: 68, evidenceLevel: "medium",
    description: "진세노사이드 성분으로, 혈행 개선과 항산화, 피부 활력 증진에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.15, efficacyP03: 0.3, efficacyP04: 0.65, efficacyP05: 0.4, efficacyP06: 0.2, efficacyP07: 0.3, efficacyP08: 0.15,
  },
  {
    koName: "로즈마리", enName: "Rosemary", tier: "A", category: "항산화",
    trendScore: 55, evidenceLevel: "medium",
    description: "카르노신산 등 항산화 성분이 풍부하며, 항균과 수렴 효과가 있습니다.",
    sideEffects: "에센셜 오일 고농도 사용 시 자극", pregnancySafe: false,
    efficacyP01: 0.3, efficacyP02: 0.3, efficacyP03: 0.2, efficacyP04: 0.4, efficacyP05: 0.1, efficacyP06: 0.2, efficacyP07: 0.15, efficacyP08: 0.35,
  },
  {
    koName: "녹두", enName: "Mung Bean", tier: "A", category: "진정",
    trendScore: 52, evidenceLevel: "low",
    description: "비텍신 성분으로, 해독과 진정, 피지 조절에 한방 전통적으로 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.3, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.2, efficacyP06: 0.5, efficacyP07: 0.2, efficacyP08: 0.4,
  },
  {
    koName: "귀리", enName: "Oat", tier: "A", category: "진정",
    trendScore: 62, evidenceLevel: "high",
    description: "아베난스라마이드 함유로, FDA 인증 피부 보호 성분. 가려움과 민감성에 효과적입니다.",
    sideEffects: "글루텐 민감 주의(외용은 대부분 안전)", pregnancySafe: true,
    efficacyP01: 0.2, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.6, efficacyP06: 0.85, efficacyP07: 0.6, efficacyP08: 0.1,
  },
  {
    koName: "쌀발효", enName: "Rice Ferment", tier: "A", category: "미백",
    trendScore: 66, evidenceLevel: "medium",
    description: "쌀 발효 추출물로, 코지산과 유사한 미백 효과와 피부결 개선이 가능합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.3, efficacyP03: 0.7, efficacyP04: 0.3, efficacyP05: 0.5, efficacyP06: 0.3, efficacyP07: 0.2, efficacyP08: 0.2,
  },
  {
    koName: "라벤더", enName: "Lavender", tier: "A", category: "진정",
    trendScore: 58, evidenceLevel: "medium",
    description: "리날룰 성분으로, 진정과 항균, 아로마 테라피 효과가 있습니다.",
    sideEffects: "에센셜 오일 원액 사용 시 자극", pregnancySafe: false,
    efficacyP01: 0.3, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.2, efficacyP06: 0.6, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "유자추출물", enName: "Yuja Extract", tier: "A", category: "미백",
    trendScore: 64, evidenceLevel: "medium",
    description: "비타민C가 풍부한 한국 전통 과일 추출물로, 톤업과 항산화에 효과적입니다.",
    sideEffects: "감귤류 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.15, efficacyP03: 0.7, efficacyP04: 0.3, efficacyP05: 0.3, efficacyP06: 0.2, efficacyP07: 0.15, efficacyP08: 0.1,
  },
  {
    koName: "매실추출물", enName: "Plum Extract", tier: "A", category: "미백",
    trendScore: 50, evidenceLevel: "low",
    description: "구연산과 비타민이 풍부하여 피부 톤 개선과 수렴 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.2, efficacyP03: 0.6, efficacyP04: 0.2, efficacyP05: 0.3, efficacyP06: 0.2, efficacyP07: 0.15, efficacyP08: 0.2,
  },
  {
    koName: "해조추출물", enName: "Seaweed Extract", tier: "A", category: "보습",
    trendScore: 58, evidenceLevel: "medium",
    description: "미네랄과 다당류가 풍부한 해양 보습 성분으로, 탄력과 영양 공급에 효과적입니다.",
    sideEffects: "요오드 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.15, efficacyP04: 0.35, efficacyP05: 0.75, efficacyP06: 0.3, efficacyP07: 0.35, efficacyP08: 0.1,
  },
  {
    koName: "진주추출물", enName: "Pearl Extract", tier: "A", category: "미백",
    trendScore: 52, evidenceLevel: "low",
    description: "콘키올린 단백질과 미네랄로, 미백과 피부 광택 개선에 전통적으로 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.1, efficacyP03: 0.6, efficacyP04: 0.2, efficacyP05: 0.3, efficacyP06: 0.2, efficacyP07: 0.1, efficacyP08: 0.05,
  },
  {
    koName: "콩발효", enName: "Soybean Ferment", tier: "A", category: "안티에이징",
    trendScore: 55, evidenceLevel: "medium",
    description: "발효 콩 추출물로, 이소플라본과 발효 대사물이 피부 탄력과 톤업에 기여합니다.",
    sideEffects: "콩 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.2, efficacyP03: 0.4, efficacyP04: 0.5, efficacyP05: 0.5, efficacyP06: 0.3, efficacyP07: 0.25, efficacyP08: 0.15,
  },
  {
    koName: "솔잎", enName: "Pine Needle", tier: "A", category: "항산화",
    trendScore: 42, evidenceLevel: "low",
    description: "프로안토시아니딘 함유로, 항산화와 혈행 개선 효과가 있는 전통 원료입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.15, efficacyP03: 0.2, efficacyP04: 0.35, efficacyP05: 0.15, efficacyP06: 0.2, efficacyP07: 0.15, efficacyP08: 0.15,
  },
  {
    koName: "연꽃추출물", enName: "Lotus Extract", tier: "A", category: "보습",
    trendScore: 50, evidenceLevel: "low",
    description: "넬룸보사이드 성분으로, 미백과 항산화, 보습 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.3, efficacyP04: 0.2, efficacyP05: 0.6, efficacyP06: 0.3, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "오크라", enName: "Okra", tier: "A", category: "보습",
    trendScore: 45, evidenceLevel: "low",
    description: "점질 다당체가 풍부하여 히알루론산과 유사한 수분 유지 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.05, efficacyP03: 0.05, efficacyP04: 0.15, efficacyP05: 0.75, efficacyP06: 0.2, efficacyP07: 0.25, efficacyP08: 0.05,
  },
  {
    koName: "비피다발효용해물", enName: "Bifida Ferment Lysate", tier: "A", category: "장벽",
    trendScore: 72, evidenceLevel: "medium",
    description: "유산균 발효 산물로, 피부 면역 강화와 장벽 복구, 항노화에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.2, efficacyP02: 0.15, efficacyP03: 0.2, efficacyP04: 0.5, efficacyP05: 0.5, efficacyP06: 0.5, efficacyP07: 0.75, efficacyP08: 0.1,
  },
  // ============== Tier B (30개) ==============
  {
    koName: "카페인", enName: "Caffeine", tier: "B", category: "진정",
    trendScore: 55, evidenceLevel: "medium",
    description: "혈관 수축과 항산화 효과로, 다크서클과 부기 완화에 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.2, efficacyP03: 0.15, efficacyP04: 0.3, efficacyP05: 0.1, efficacyP06: 0.1, efficacyP07: 0.1, efficacyP08: 0.3,
  },
  {
    koName: "멘톨", enName: "Menthol", tier: "B", category: "진정",
    trendScore: 40, evidenceLevel: "medium",
    description: "박하 유래 청량 성분으로, 가려움 완화와 즉각적인 쿨링 효과가 있습니다.",
    sideEffects: "민감 피부 자극, 눈 주변 사용 주의", pregnancySafe: false,
    efficacyP01: 0.15, efficacyP02: 0.1, efficacyP03: 0.05, efficacyP04: 0.05, efficacyP05: 0.05, efficacyP06: 0.2, efficacyP07: 0.1, efficacyP08: 0.2,
  },
  {
    koName: "캐모마일", enName: "Chamomile", tier: "B", category: "진정",
    trendScore: 58, evidenceLevel: "medium",
    description: "비사보롤과 아줄렌 함유로, 진정과 항염에 오래 사용된 천연 성분입니다.",
    sideEffects: "국화과 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.35, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.3, efficacyP06: 0.75, efficacyP07: 0.5, efficacyP08: 0.1,
  },
  {
    koName: "시어버터", enName: "Shea Butter", tier: "B", category: "보습",
    trendScore: 55, evidenceLevel: "medium",
    description: "시어나무 열매 지방으로, 깊은 보습과 피부 보호막 형성에 효과적입니다.",
    sideEffects: "견과류 알레르기 주의(드물게)", pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.05, efficacyP03: 0.05, efficacyP04: 0.2, efficacyP05: 0.85, efficacyP06: 0.35, efficacyP07: 0.45, efficacyP08: 0.05,
  },
  {
    koName: "피토스핑고신", enName: "Phytosphingosine", tier: "B", category: "장벽",
    trendScore: 48, evidenceLevel: "high",
    description: "세라마이드 전구체로, 항균과 장벽 강화에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.15, efficacyP03: 0.1, efficacyP04: 0.15, efficacyP05: 0.5, efficacyP06: 0.5, efficacyP07: 0.7, efficacyP08: 0.2,
  },
  {
    koName: "콜레스테롤", enName: "Cholesterol", tier: "B", category: "장벽",
    trendScore: 38, evidenceLevel: "high",
    description: "피부 장벽 3대 지질 성분 중 하나로, 세라마이드와 함께 장벽 복구에 필수적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.05, efficacyP03: 0.05, efficacyP04: 0.15, efficacyP05: 0.65, efficacyP06: 0.45, efficacyP07: 0.75, efficacyP08: 0.05,
  },
  {
    koName: "락토바실러스", enName: "Lactobacillus", tier: "B", category: "장벽",
    trendScore: 62, evidenceLevel: "medium",
    description: "유산균 발효 산물로, 피부 마이크로바이옴 균형과 장벽 강화에 기여합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.4, efficacyP06: 0.55, efficacyP07: 0.65, efficacyP08: 0.15,
  },
  {
    koName: "아르간오일", enName: "Argan Oil", tier: "B", category: "보습",
    trendScore: 58, evidenceLevel: "medium",
    description: "비타민E와 필수지방산이 풍부한 프리미엄 오일로, 보습과 탄력에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.05, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.3, efficacyP05: 0.8, efficacyP06: 0.3, efficacyP07: 0.35, efficacyP08: 0.05,
  },
  {
    koName: "코코넛오일", enName: "Coconut Oil", tier: "B", category: "보습",
    trendScore: 52, evidenceLevel: "medium",
    description: "라우르산 함유로, 보습과 항균에 효과적이나 모공 막힘 주의가 필요합니다.",
    sideEffects: "코메도제닉(모공 막힘 유발 가능)", pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.05, efficacyP03: 0.05, efficacyP04: 0.1, efficacyP05: 0.75, efficacyP06: 0.2, efficacyP07: 0.3, efficacyP08: 0.05,
  },
  {
    koName: "감자전분", enName: "Potato Starch", tier: "B", category: "진정",
    trendScore: 30, evidenceLevel: "low",
    description: "피부 진정과 수분 흡수에 사용되는 천연 전분 성분입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.1, efficacyP03: 0.05, efficacyP04: 0.05, efficacyP05: 0.3, efficacyP06: 0.4, efficacyP07: 0.2, efficacyP08: 0.25,
  },
  {
    koName: "수박추출물", enName: "Watermelon Extract", tier: "B", category: "보습",
    trendScore: 48, evidenceLevel: "low",
    description: "수분과 시트룰린이 풍부하여 보습과 진정에 효과적인 과일 추출물입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.7, efficacyP06: 0.3, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "포도씨추출물", enName: "Grape Seed Extract", tier: "B", category: "항산화",
    trendScore: 52, evidenceLevel: "medium",
    description: "OPC(프로안토시아니딘) 함유로, 비타민C의 20배 항산화력을 가진 성분입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.2, efficacyP03: 0.3, efficacyP04: 0.45, efficacyP05: 0.2, efficacyP06: 0.2, efficacyP07: 0.2, efficacyP08: 0.2,
  },
  {
    koName: "석류추출물", enName: "Pomegranate Extract", tier: "B", category: "안티에이징",
    trendScore: 55, evidenceLevel: "medium",
    description: "엘라그산과 안토시아닌이 풍부하여 항산화와 피부 탄력 개선에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.3, efficacyP04: 0.5, efficacyP05: 0.3, efficacyP06: 0.2, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "블루베리", enName: "Blueberry", tier: "B", category: "항산화",
    trendScore: 48, evidenceLevel: "low",
    description: "안토시아닌이 풍부한 슈퍼푸드로, 항산화와 피부 보호에 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.2, efficacyP04: 0.35, efficacyP05: 0.2, efficacyP06: 0.15, efficacyP07: 0.15, efficacyP08: 0.1,
  },
  {
    koName: "아사이베리", enName: "Acai Berry", tier: "B", category: "항산화",
    trendScore: 45, evidenceLevel: "low",
    description: "폴리페놀과 오메가지방산이 풍부한 항산화 슈퍼푸드 추출물입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.2, efficacyP04: 0.35, efficacyP05: 0.3, efficacyP06: 0.15, efficacyP07: 0.15, efficacyP08: 0.1,
  },
  {
    koName: "딸기추출물", enName: "Strawberry Extract", tier: "B", category: "미백",
    trendScore: 42, evidenceLevel: "low",
    description: "비타민C와 엘라그산으로, 가벼운 미백과 항산화 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.45, efficacyP04: 0.15, efficacyP05: 0.2, efficacyP06: 0.1, efficacyP07: 0.1, efficacyP08: 0.1,
  },
  {
    koName: "체리추출물", enName: "Cherry Extract", tier: "B", category: "항산화",
    trendScore: 40, evidenceLevel: "low",
    description: "안토시아닌과 비타민C로, 항산화와 피부 활력 증진에 기여합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.25, efficacyP04: 0.25, efficacyP05: 0.2, efficacyP06: 0.15, efficacyP07: 0.1, efficacyP08: 0.1,
  },
  {
    koName: "파파야효소", enName: "Papaya Enzyme", tier: "B", category: "각질",
    trendScore: 50, evidenceLevel: "medium",
    description: "파파인 효소로, 부드러운 각질 분해와 피부결 개선에 효과적입니다.",
    sideEffects: "민감 피부 자극 가능, 라텍스 알레르기 교차 반응", pregnancySafe: true,
    efficacyP01: 0.3, efficacyP02: 0.4, efficacyP03: 0.3, efficacyP04: 0.15, efficacyP05: 0.1, efficacyP06: 0.15, efficacyP07: 0.1, efficacyP08: 0.35,
  },
  {
    koName: "파인애플효소", enName: "Pineapple Enzyme", tier: "B", category: "각질",
    trendScore: 45, evidenceLevel: "medium",
    description: "브로멜라인 효소로, 단백질 분해를 통한 각질 제거와 피부 정화에 사용됩니다.",
    sideEffects: "민감 피부 자극 가능", pregnancySafe: true,
    efficacyP01: 0.25, efficacyP02: 0.35, efficacyP03: 0.25, efficacyP04: 0.1, efficacyP05: 0.1, efficacyP06: 0.15, efficacyP07: 0.1, efficacyP08: 0.3,
  },
  {
    koName: "꿀추출물", enName: "Honey Extract", tier: "B", category: "보습",
    trendScore: 55, evidenceLevel: "medium",
    description: "천연 보습제이자 항균 물질로, 수분 공급과 상처 치유에 효과적입니다.",
    sideEffects: "꿀벌 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.25, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.15, efficacyP05: 0.75, efficacyP06: 0.35, efficacyP07: 0.4, efficacyP08: 0.1,
  },
  {
    koName: "로얄젤리", enName: "Royal Jelly", tier: "B", category: "안티에이징",
    trendScore: 50, evidenceLevel: "low",
    description: "10-HDA 등 특수 지방산이 함유된 영양 성분으로, 피부 활력과 탄력에 기여합니다.",
    sideEffects: "꿀벌 알레르기 주의", pregnancySafe: false,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.15, efficacyP04: 0.45, efficacyP05: 0.5, efficacyP06: 0.2, efficacyP07: 0.25, efficacyP08: 0.1,
  },
  {
    koName: "밀크오트", enName: "Milk Oat", tier: "B", category: "진정",
    trendScore: 42, evidenceLevel: "low",
    description: "귀리 우유 성분으로, 부드러운 진정과 보습 효과가 있습니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.6, efficacyP06: 0.65, efficacyP07: 0.4, efficacyP08: 0.1,
  },
  {
    koName: "쌀겨", enName: "Rice Bran", tier: "B", category: "미백",
    trendScore: 48, evidenceLevel: "medium",
    description: "감마오리자놀과 페룰산으로, 미백과 항산화, 자외선 차단에 기여합니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.15, efficacyP03: 0.55, efficacyP04: 0.25, efficacyP05: 0.4, efficacyP06: 0.2, efficacyP07: 0.15, efficacyP08: 0.1,
  },
  {
    koName: "녹차씨드", enName: "Green Tea Seed", tier: "B", category: "보습",
    trendScore: 52, evidenceLevel: "low",
    description: "녹차 씨앗 오일로, 올레산과 리놀레산이 풍부하여 보습과 장벽 보호에 효과적입니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.2, efficacyP05: 0.7, efficacyP06: 0.25, efficacyP07: 0.3, efficacyP08: 0.1,
  },
  {
    koName: "오이추출물", enName: "Cucumber Extract", tier: "B", category: "진정",
    trendScore: 50, evidenceLevel: "low",
    description: "수분과 비타민K가 풍부하여 진정과 쿨링, 부기 완화에 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.6, efficacyP06: 0.5, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "장미수", enName: "Rose Water", tier: "B", category: "진정",
    trendScore: 55, evidenceLevel: "low",
    description: "장미 증류수로, 진정과 수분 공급, pH 밸런스에 효과적입니다.",
    sideEffects: "향료 민감 주의", pregnancySafe: true,
    efficacyP01: 0.15, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.1, efficacyP05: 0.5, efficacyP06: 0.5, efficacyP07: 0.2, efficacyP08: 0.1,
  },
  {
    koName: "국화추출물", enName: "Chrysanthemum Extract", tier: "B", category: "진정",
    trendScore: 38, evidenceLevel: "low",
    description: "항산화와 진정 효과가 있는 한방 전통 원료입니다.",
    sideEffects: "국화과 알레르기 주의", pregnancySafe: true,
    efficacyP01: 0.2, efficacyP02: 0.1, efficacyP03: 0.1, efficacyP04: 0.15, efficacyP05: 0.2, efficacyP06: 0.55, efficacyP07: 0.25, efficacyP08: 0.1,
  },
  {
    koName: "소나무추출물", enName: "Pine Extract", tier: "B", category: "항산화",
    trendScore: 40, evidenceLevel: "low",
    description: "피크노제놀 등 프로안토시아니딘으로, 강력한 항산화와 혈행 개선에 사용됩니다.",
    sideEffects: null, pregnancySafe: true,
    efficacyP01: 0.1, efficacyP02: 0.1, efficacyP03: 0.2, efficacyP04: 0.35, efficacyP05: 0.15, efficacyP06: 0.15, efficacyP07: 0.15, efficacyP08: 0.1,
  },
  {
    koName: "편백추출물", enName: "Hinoki Extract", tier: "B", category: "진정",
    trendScore: 55, evidenceLevel: "medium",
    description: "피톤치드 함유로, 항균과 진정, 피부 정화에 효과적인 침엽수 추출물입니다.",
    sideEffects: "민감 피부 주의", pregnancySafe: true,
    efficacyP01: 0.4, efficacyP02: 0.15, efficacyP03: 0.05, efficacyP04: 0.1, efficacyP05: 0.2, efficacyP06: 0.5, efficacyP07: 0.3, efficacyP08: 0.25,
  },
  {
    koName: "월계수", enName: "Bay Leaf", tier: "B", category: "진정",
    trendScore: 32, evidenceLevel: "low",
    description: "유게놀 성분으로, 항균과 항산화 효과가 있는 전통 허브입니다.",
    sideEffects: "에센셜 오일 고농도 사용 시 자극", pregnancySafe: false,
    efficacyP01: 0.25, efficacyP02: 0.1, efficacyP03: 0.05, efficacyP04: 0.1, efficacyP05: 0.1, efficacyP06: 0.3, efficacyP07: 0.15, efficacyP08: 0.2,
  },
];

async function main() {
  console.log(`성분 ${INGREDIENTS.length}개 생성 시작...`);

  let success = 0;
  let failed = 0;

  for (const [idx, ing] of INGREDIENTS.entries()) {
    try {
      await prisma.ingredientMaster.upsert({
        where: { koName: ing.koName },
        update: {
          enName: ing.enName,
          category: ing.category,
          tier: ing.tier,
          trendScore: ing.trendScore,
          evidenceLevel: ing.evidenceLevel,
          description: ing.description,
          sideEffects: ing.sideEffects,
          pregnancySafe: ing.pregnancySafe,
          efficacyP01: ing.efficacyP01,
          efficacyP02: ing.efficacyP02,
          efficacyP03: ing.efficacyP03,
          efficacyP04: ing.efficacyP04,
          efficacyP05: ing.efficacyP05,
          efficacyP06: ing.efficacyP06,
          efficacyP07: ing.efficacyP07,
          efficacyP08: ing.efficacyP08,
        },
        create: {
          koName: ing.koName,
          enName: ing.enName,
          category: ing.category,
          tier: ing.tier,
          trendScore: ing.trendScore,
          evidenceLevel: ing.evidenceLevel,
          description: ing.description,
          sideEffects: ing.sideEffects,
          pregnancySafe: ing.pregnancySafe,
          efficacyP01: ing.efficacyP01,
          efficacyP02: ing.efficacyP02,
          efficacyP03: ing.efficacyP03,
          efficacyP04: ing.efficacyP04,
          efficacyP05: ing.efficacyP05,
          efficacyP06: ing.efficacyP06,
          efficacyP07: ing.efficacyP07,
          efficacyP08: ing.efficacyP08,
        },
      });
      success++;
      if ((idx + 1) % 10 === 0) {
        console.log(`[${idx + 1}/${INGREDIENTS.length}] 진행 중...`);
      }
    } catch (e) {
      console.error(`실패: ${ing.koName}`, e);
      failed++;
    }
  }

  console.log(`\n완료: 성공 ${success}, 실패 ${failed}`);

  // PDRN 검증
  const pdrn = await prisma.ingredientMaster.findUnique({
    where: { koName: "PDRN" },
  });
  if (pdrn) {
    console.log(
      `PDRN 효능: P04(주름)=${Number(pdrn.efficacyP04)}, P07(장벽)=${Number(pdrn.efficacyP07)}`
    );
  }
}

main().finally(() => prisma.$disconnect());
