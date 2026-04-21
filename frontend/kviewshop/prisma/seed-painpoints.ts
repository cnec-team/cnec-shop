import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const painPoints = [
  {
    code: "P01",
    koName: "여드름·트러블",
    enName: "Acne & Blemishes",
    shortName: "여드름",
    description:
      "여드름, 붉은기, 농포, 화농, 좁쌀여드름 등 트러블 피부 고민",
    iconName: "Droplet",
    severityLevels: {
      1: "가끔 한두 개",
      2: "월 1~2회 올라옴",
      3: "자주 올라옴",
      4: "거의 매일 신경 쓰임",
      5: "심각한 트러블",
    },
    sortOrder: 1,
  },
  {
    code: "P02",
    koName: "모공",
    enName: "Enlarged Pores",
    shortName: "모공",
    description: "확장된 모공, 블랙헤드, 화이트헤드, 거친 피부결",
    iconName: "Circle",
    severityLevels: {
      1: "티 안 남",
      2: "코 주변만",
      3: "T존 전체",
      4: "볼까지",
      5: "전체적으로 눈에 띔",
    },
    sortOrder: 2,
  },
  {
    code: "P03",
    koName: "기미·잡티·색소침착",
    enName: "Hyperpigmentation",
    shortName: "기미/잡티",
    description: "기미, 잡티, 주근깨, 다크스팟, 칙칙함, 톤 불균일",
    iconName: "Sun",
    severityLevels: {
      1: "거의 없음",
      2: "연한 잡티 몇 개",
      3: "기미 시작",
      4: "눈에 띄는 기미",
      5: "진한 색소침착",
    },
    sortOrder: 3,
  },
  {
    code: "P04",
    koName: "주름·탄력",
    enName: "Wrinkles & Firmness",
    shortName: "주름",
    description: "잔주름, 깊은 주름, 처짐, 탄력 저하, 안티에이징",
    iconName: "Waves",
    severityLevels: {
      1: "표정 주름만",
      2: "눈가 잔주름",
      3: "전반적 잔주름",
      4: "깊은 주름 생김",
      5: "처짐 뚜렷",
    },
    sortOrder: 4,
  },
  {
    code: "P05",
    koName: "건조·보습",
    enName: "Dryness",
    shortName: "건조",
    description: "건조함, 속건조, 푸석함, 각질, 당김",
    iconName: "CloudDrizzle",
    severityLevels: {
      1: "가끔 건조",
      2: "환절기에만",
      3: "자주 건조",
      4: "각질 자주 생김",
      5: "당김이 심함",
    },
    sortOrder: 5,
  },
  {
    code: "P06",
    koName: "민감·자극",
    enName: "Sensitivity",
    shortName: "민감",
    description: "민감성, 홍조, 알레르기, 따가움, 자극",
    iconName: "Flame",
    severityLevels: {
      1: "거의 없음",
      2: "특정 성분에만",
      3: "자주 붉어짐",
      4: "쉽게 따가움",
      5: "심한 민감성",
    },
    sortOrder: 6,
  },
  {
    code: "P07",
    koName: "장벽 손상",
    enName: "Barrier Damage",
    shortName: "장벽 손상",
    description: "시술 후 회복, 피부 장벽 손상, 박탈성 시술 케어",
    iconName: "Shield",
    severityLevels: {
      1: "시술 이력 없음",
      2: "가끔 시술 후",
      3: "정기 시술 중",
      4: "강한 시술 후",
      5: "박탈 시술 직후",
    },
    sortOrder: 7,
  },
  {
    code: "P08",
    koName: "유분·블랙헤드",
    enName: "Excess Oil",
    shortName: "유분",
    description: "과잉 유분, 번들거림, 화장 무너짐",
    iconName: "Droplets",
    severityLevels: {
      1: "거의 없음",
      2: "T존만",
      3: "전체적으로 번들",
      4: "화장이 무너짐",
      5: "심한 유분",
    },
    sortOrder: 8,
  },
];

async function main() {
  for (const pp of painPoints) {
    await prisma.painPointMaster.upsert({
      where: { code: pp.code },
      update: pp,
      create: pp,
    });
  }
  console.log(`페인포인트 ${painPoints.length}개 시드 완료`);
}

main().finally(() => prisma.$disconnect());
