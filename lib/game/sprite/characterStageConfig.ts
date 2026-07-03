// ---------------------------------------------------------------------------
// characterStageConfig.ts
// 성장 단계별 외형 설정 + 사람형 픽셀 캐릭터를 "부품 레이어"로 조립하는 빌더.
//
// 단색 LCD 잉크 방향:
//   매트릭스의 각 셀은 색이 아니라 코드(K/S/F/W)를 담고,
//   렌더러가 팔레트(characterPalettes)로 명도 램프를 입힌다.
//
// 한 칸 = 16×20 그리드의 1픽셀. 부품(머리/머리카락/몸통/팔/다리/소품/오버레이)을
// 순서대로 스탬핑해 조합하므로, 단계×상태 조합을 일일이 그리지 않아도 된다.
// ---------------------------------------------------------------------------

import type { CharacterAppearance, Gender, LifeStage, WardrobeItemKey } from "@/types/character";
import type { BodyShape } from "@/lib/game/weight";
import type { EquippedWardrobe } from "@/lib/game/wardrobe";
import type {
  CharacterVisualState,
  ExpressionKey,
  JobType,
  PoseKey,
} from "./characterVisualState";

/** 기본(외형 미지정) 캐릭터용 — 미리보기 갤러리 등에서 사용 */
export const DEFAULT_APPEARANCE: CharacterAppearance = {
  hairVariant: 0,
  hairTone: "dark",
  glasses: false,
  faceAccent: "none",
};

export const GRID_W = 16;
export const GRID_H = 20;

export type SpriteTier = "tiny" | "small" | "mid" | "full";
export type RoomTheme =
  | "nursery"
  | "kidRoom"
  | "studyRoom"
  | "campus"
  | "jobseekerRoom"
  | "office"
  | "seniorOffice";

interface Outfit {
  base: "F" | "S" | "K"; // 몸통 기본 톤(K = 어두운 가죽/블랙)
  collar?: boolean; // 어두운 깃(교복/정장)
  tie?: boolean; // 넥타이
  blazer?: boolean; // 재킷(양 옆 S, 가운데 셔츠)
  badge?: boolean; // 사원증
  straps?: boolean; // 책가방 끈
  hood?: boolean; // 후드티 끈
  diaper?: boolean; // 아기 기저귀
  stripe?: boolean; // 가로 줄무늬(옷장: 줄무늬 티)
  zip?: boolean; // 지퍼 세로줄(옷장: 집업 재킷)
  skirt?: boolean; // 치마 플레어(옷장: 원피스)
  quilt?: boolean; // 누빔 가로선(옷장: 패딩 점퍼)
  bib?: boolean; // 멜빵끈 + 가슴 패널(옷장: 멜빵바지)
  sleeveless?: boolean; // 민소매(옷장: 수영복)
  pinstripe?: boolean; // 세로 줄무늬(옷장: 야구 유니폼)
  cardigan?: boolean; // 앞트임 세로 라인(옷장: 니트 가디건)
  denimPatch?: boolean; // 가슴 패치 포켓(옷장: 청청 세트)
  longCollar?: boolean; // 긴 깃 + 허리 벨트(옷장: 트렌치코트)
  hanbokSash?: boolean; // 브이넥 옷고름(옷장: 한복)
  lapel?: boolean; // 보타이 + 라펠(옷장: 턱시도)
}

/** 옷장 의상 → 스프라이트 복장 정의(착용 시 단계 기본 복장·직업 악센트를 대체) */
const WARDROBE_OUTFITS: Partial<Record<WardrobeItemKey, Outfit>> = {
  stripeTee: { base: "F", stripe: true },
  hoodie: { base: "S", hood: true },
  jacket: { base: "S", collar: true, zip: true },
  suit: { base: "F", blazer: true, collar: true, tie: true },
  training: { base: "S", zip: true, stripe: true },
  dress: { base: "F", skirt: true },
  padding: { base: "S", quilt: true },
  leather: { base: "K", zip: true },
  overalls: { base: "S", bib: true },
  swimsuit: { base: "K", sleeveless: true },
  baseballUniform: { base: "F", pinstripe: true },
  knitCardigan: { base: "S", cardigan: true },
  denimSet: { base: "S", zip: true, denimPatch: true },
  trenchCoat: { base: "K", longCollar: true },
  hanbok: { base: "F", hanbokSash: true },
  tuxedo: { base: "K", blazer: true, lapel: true },
};

export interface StageVisualConfig {
  tier: SpriteTier;
  hair: "tuft" | "short" | "mid" | "neat" | "senior";
  outfit: Outfit;
  room: RoomTheme;
  /** 단계 고유 소품(액션 소품이 없을 때 표시) */
  stageProp: "none" | "bag" | "file" | "badge" | "toy";
  label: string;
}

export const STAGE_CONFIG: Record<LifeStage, StageVisualConfig> = {
  baby: { tier: "tiny", hair: "tuft", outfit: { base: "F", diaper: true }, room: "nursery", stageProp: "toy", label: "아기" },
  child: { tier: "small", hair: "short", outfit: { base: "F" }, room: "kidRoom", stageProp: "toy", label: "유아" },
  elementary: { tier: "small", hair: "short", outfit: { base: "F", straps: true }, room: "kidRoom", stageProp: "bag", label: "초등학생" },
  middle: { tier: "mid", hair: "mid", outfit: { base: "F", collar: true }, room: "studyRoom", stageProp: "none", label: "중학생" },
  high: { tier: "mid", hair: "mid", outfit: { base: "F", collar: true, tie: true }, room: "studyRoom", stageProp: "none", label: "고등학생" },
  university: { tier: "mid", hair: "mid", outfit: { base: "S", hood: true }, room: "campus", stageProp: "none", label: "대학생" },
  jobseeker: { tier: "mid", hair: "neat", outfit: { base: "F", blazer: true, collar: true }, room: "jobseekerRoom", stageProp: "file", label: "취준생" },
  employee: { tier: "full", hair: "neat", outfit: { base: "F", collar: true, tie: true, badge: true }, room: "office", stageProp: "badge", label: "직장인" },
  senior: { tier: "full", hair: "senior", outfit: { base: "S", blazer: true, collar: true, tie: true, badge: true }, room: "seniorOffice", stageProp: "badge", label: "경력직" },
  retirement: { tier: "full", hair: "senior", outfit: { base: "S", blazer: true }, room: "seniorOffice", stageProp: "none", label: "은퇴 준비" },
};

export function roomThemeForStage(stage: LifeStage): RoomTheme {
  return STAGE_CONFIG[stage].room;
}

// ---------------------------------------------------------------------------
// 그리드 유틸
// ---------------------------------------------------------------------------

type Grid = string[][];

function blank(): Grid {
  return Array.from({ length: GRID_H }, () => Array<string>(GRID_W).fill("."));
}
function set(g: Grid, x: number, y: number, c: string) {
  if (c !== "." && x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) g[y][x] = c;
}
/** 픽셀 지우기(투명으로) — slim 체형의 실루엣 다듬기에 사용 */
function clear(g: Grid, x: number, y: number) {
  if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) g[y][x] = ".";
}
function fillRect(g: Grid, x0: number, x1: number, y0: number, y1: number, c: string) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(g, x, y, c);
}
/** 작은 비트맵 스탬프 (".": 건너뜀) */
function stamp(g: Grid, x0: number, y0: number, rows: string[]) {
  rows.forEach((r, dy) => r.split("").forEach((c, dx) => set(g, x0 + dx, y0 + dy, c)));
}

// ---------------------------------------------------------------------------
// 앵커(부품 위치) — small/mid/full 공통(머리 위치 동일), tiny 는 별도 처리
// ---------------------------------------------------------------------------

interface Anchor {
  headTop: number;
  eyesRow: number;
  mouthRow: number;
  chin: number;
  torsoTop: number;
  torsoBot: number;
  legTop: number;
  legBot: number;
  tl: number; // 몸통 좌측 열
  tr: number; // 몸통 우측 열
}

function anchorFor(tier: SpriteTier): Anchor {
  const head = { headTop: 1, eyesRow: 3, mouthRow: 5, chin: 6, torsoTop: 8 };
  if (tier === "small")
    return { ...head, torsoBot: 11, legTop: 12, legBot: 15, tl: 6, tr: 9 };
  if (tier === "full")
    return { ...head, torsoBot: 12, legTop: 13, legBot: 18, tl: 5, tr: 10 };
  // mid (default)
  return { ...head, torsoBot: 12, legTop: 13, legBot: 17, tl: 5, tr: 10 };
}

// ---------------------------------------------------------------------------
// 얼굴(표정)
// ---------------------------------------------------------------------------

function drawFace(g: Grid, expr: ExpressionKey, A: Anchor) {
  const eR = A.eyesRow;
  const mR = A.mouthRow;
  const cR = A.chin;

  const openEyes = () => {
    set(g, 6, eR, "K");
    set(g, 9, eR, "K");
  };
  const closedEyes = () => {
    set(g, 5, eR, "K");
    set(g, 6, eR, "K");
    set(g, 9, eR, "K");
    set(g, 10, eR, "K");
  };
  const brows = () => {
    set(g, 5, eR - 1, "K");
    set(g, 10, eR - 1, "K");
  };
  const mouthNeutral = () => {
    set(g, 7, mR, "K");
    set(g, 8, mR, "K");
  };
  const mouthSmile = () => {
    set(g, 6, mR, "K");
    set(g, 9, mR, "K");
    set(g, 7, cR, "K");
    set(g, 8, cR, "K");
  };
  const mouthFrown = () => {
    set(g, 7, mR, "K");
    set(g, 8, mR, "K");
    set(g, 6, cR, "K");
    set(g, 9, cR, "K");
  };
  const mouthOpen = () => {
    set(g, 7, mR, "K");
    set(g, 8, mR, "K");
    set(g, 7, cR, "K");
    set(g, 8, cR, "K");
  };

  switch (expr) {
    case "happy":
      openEyes();
      mouthSmile();
      break;
    case "sad":
      openEyes();
      mouthFrown();
      break;
    case "sleepy":
      closedEyes();
      mouthNeutral();
      break;
    case "hungry":
      openEyes();
      mouthOpen();
      break;
    case "sick":
      closedEyes();
      mouthFrown();
      break;
    case "tired":
      closedEyes();
      mouthNeutral();
      break;
    case "stressed":
      openEyes();
      brows();
      mouthNeutral();
      break;
    default:
      openEyes();
      mouthNeutral();
  }
}

/** 안경 — drawFace 이후(눈 위에 덧그림)에 호출해야 함 */
function drawGlasses(g: Grid, A: Anchor) {
  for (let x = 5; x <= 10; x++) set(g, x, A.eyesRow, "K");
}

/**
 * 볼 포인트(주근깨/볼터치) — 눈과 입 사이 볼 위치에 점을 찍는다.
 * 밴드(bandage) 오버레이가 나중에 그려지므로 아픈 상태에선 자연스럽게 덮인다.
 */
function drawFaceAccent(
  g: Grid,
  A: Anchor,
  accent: CharacterAppearance["faceAccent"],
  cheekRow = A.eyesRow + 1,
) {
  if (accent === "freckles") {
    set(g, 5, cheekRow, "K");
    set(g, 10, cheekRow, "K");
  } else if (accent === "blush") {
    set(g, 5, cheekRow, "S");
    set(g, 6, cheekRow, "S");
    set(g, 9, cheekRow, "S");
    set(g, 10, cheekRow, "S");
  }
}

/**
 * 옷장 액세서리 — 머리(모자)/목(목도리) 부위에 덧그린다.
 * 반드시 drawHead/drawFace 이후에 호출(모자가 머리카락을 덮어야 함).
 */
function drawAccessory(g: Grid, A: Anchor, key: WardrobeItemKey) {
  switch (key) {
    case "cap": // 캡모자 — 크라운 + 오른쪽 챙
      for (let x = 5; x <= 10; x++) set(g, x, 0, "S");
      set(g, 11, 1, "S");
      set(g, 12, 1, "S");
      break;
    case "beanie": // 비니 — 진한 크라운 + 접힌 밴드
      for (let x = 5; x <= 10; x++) set(g, x, 0, "K");
      for (let x = 5; x <= 10; x++) set(g, x, 1, "S");
      break;
    case "scarf": // 목도리 — 목을 감싸고 한쪽 자락이 흘러내림
      for (let x = 6; x <= 9; x++) set(g, x, A.chin + 1, "S");
      set(g, 6, A.torsoTop, "S");
      set(g, 6, A.torsoTop + 1, "S");
      break;
    case "ribbon": // 리본핀 — 머리 오른쪽 반짝이 포인트
      set(g, 10, 0, "W");
      set(g, 11, 1, "S");
      break;
    case "sunglasses": // 선글라스 — 안경보다 넓고 두꺼운 렌즈
      for (let x = 4; x <= 11; x++) set(g, x, A.eyesRow, "K");
      set(g, 5, A.eyesRow + 1, "K");
      set(g, 6, A.eyesRow + 1, "K");
      set(g, 9, A.eyesRow + 1, "K");
      set(g, 10, A.eyesRow + 1, "K");
      break;
    case "headphones": // 헤드폰 — 머리 위 밴드 + 양쪽 이어패드
      for (let x = 5; x <= 10; x++) set(g, x, 0, "K");
      set(g, 4, A.eyesRow - 1, "K");
      set(g, 4, A.eyesRow, "K");
      set(g, 11, A.eyesRow - 1, "K");
      set(g, 11, A.eyesRow, "K");
      break;
    case "necklace": // 목걸이 — 쇄골 라인 반짝임 + 펜던트
      set(g, 6, A.torsoTop, "W");
      set(g, 9, A.torsoTop, "W");
      set(g, 7, A.torsoTop + 1, "W");
      set(g, 8, A.torsoTop + 1, "W");
      break;
    case "crown": // 왕관 — 머리 위 반짝이 밴드
      for (let x = 5; x <= 10; x++) set(g, x, 0, "W");
      set(g, 5, 1, "W");
      set(g, 10, 1, "W");
      break;
    case "hairpin": // 헤어핀 세트 — 머리 왼쪽 반짝이(리본과 반대쪽)
      set(g, 5, 0, "W");
      set(g, 6, 1, "W");
      break;
    case "gloves": // 장갑 — 양손 색을 바꿔 착용감을 표현
      set(g, A.tl - 1, A.torsoBot, "S");
      set(g, A.tr + 1, A.torsoBot, "S");
      break;
    case "bowtie": // 나비넥타이 — 목 아래 작은 리본
      set(g, 7, A.torsoTop, "K");
      set(g, 8, A.torsoTop, "K");
      set(g, 6, A.torsoTop, "S");
      set(g, 9, A.torsoTop, "S");
      break;
    case "backpack": // 백팩 — 어깨 아래 사각 스트랩
      set(g, A.tl, A.torsoTop + 1, "K");
      set(g, A.tr, A.torsoTop + 1, "K");
      set(g, A.tl, A.torsoTop + 2, "K");
      set(g, A.tr, A.torsoTop + 2, "K");
      break;
    case "watch": // 손목시계 — 손목 포인트
      set(g, A.tr + 1, A.torsoBot - 1, "W");
      break;
    case "earrings": // 귀걸이 — 얼굴 양옆 반짝임
      set(g, 4, A.eyesRow + 1, "W");
      set(g, 11, A.eyesRow + 1, "W");
      break;
    case "brooch": // 브로치 — 가슴팍 반짝이 포인트
      set(g, 6, A.torsoTop + 1, "W");
      break;
    case "anklet": // 발찌 — 다리 아래쪽 반짝임
      set(g, 7, A.legBot, "W");
      set(g, 8, A.legBot, "W");
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// 머리 + 머리카락 (스타일 5종 × 톤 2종으로 캐릭터마다 다르게 보이도록)
// ---------------------------------------------------------------------------

/**
 * 앞머리 스타일 템플릿(윗줄/이마줄 2행) — "K" 자리에 실제 톤 색을 채운다.
 * "." 은 비워 두어 아래 피부(F)가 비치므로 텍스처 차이가 생긴다.
 */
function hairTemplate(variant: CharacterAppearance["hairVariant"]): [string, string] {
  switch (variant) {
    case 1:
      return ["KKKKK.", "KKKKKK"]; // 사이드(비대칭 앞머리)
    case 2:
      return [".K.K.K", "KKKKKK"]; // 스파이키(텍스처)
    case 3:
      return ["KKKKKK", "KKKKKK"]; // 일자 풀뱅(덮는 앞머리)
    case 4:
      return [".KKKK.", "K.KK.K"]; // 곱슬(이마줄에 컬 텍스처)
    default:
      return [".KKKK.", "KKKKKK"]; // 가운데 가르마(기본)
  }
}

/** 템플릿의 "K" 자리를 실제 톤 색으로 치환 */
function tonedRow(template: string, tone: string): string {
  return template
    .split("")
    .map((c) => (c === "K" ? tone : c))
    .join("");
}

function drawHead(
  g: Grid,
  A: Anchor,
  cfg: StageVisualConfig,
  gender?: Gender,
  appearance: CharacterAppearance = DEFAULT_APPEARANCE,
) {
  // 피부(머리 윤곽) cols 5-10, rows headTop..chin
  stamp(g, 5, A.headTop, [
    ".FFFF.",
    "FFFFFF",
    "FFFFFF",
    "FFFFFF",
    "FFFFFF",
    ".FFFF.",
  ]);

  // 머리카락 — senior 는 항상 흰머리(S), 그 외는 캐릭터별 톤(K 진함/S 밝음)
  const tone = cfg.hair === "senior" ? "S" : appearance.hairTone === "light" ? "S" : "K";
  const female = gender === "female";
  switch (cfg.hair) {
    case "tuft": // 아기: 정수리 한 줌
      set(g, 7, 0, tone);
      set(g, 8, 0, tone);
      set(g, 8, 1, tone);
      break;
    case "short":
    case "mid":
    case "neat": {
      const [top, brow] = hairTemplate(appearance.hairVariant);
      stamp(g, 5, 0, [tonedRow(top, tone), tonedRow(brow, tone)]);
      if (cfg.hair === "mid") {
        set(g, 5, 2, tone);
        set(g, 10, 2, tone);
      } else if (cfg.hair === "neat" && appearance.hairVariant <= 1) {
        set(g, 7, 1, "F"); // 가르마 하이라이트(가르마 스타일에만)
      }
      break;
    }
    case "senior": // 희끗(S 톤) + 살짝 벗겨진 정수리
      stamp(g, 5, 0, [".SSSS.", "S.SS.S"]);
      set(g, 5, 2, "S");
      set(g, 10, 2, "S");
      break;
  }
  // 여성: 옆머리를 볼까지 길게
  if (female && cfg.hair !== "tuft") {
    const side = cfg.hair === "senior" ? "S" : tone;
    set(g, 5, 2, side);
    set(g, 10, 2, side);
    set(g, 5, 3, side);
    set(g, 10, 3, side);
  }
}

// ---------------------------------------------------------------------------
// 몸통 + 옷 + 팔
// ---------------------------------------------------------------------------

function drawBody(
  g: Grid,
  A: Anchor,
  cfg: StageVisualConfig,
  pose: PoseKey,
  jobType: JobType,
  bodyShape: BodyShape = "normal",
  outfitOverride?: Outfit,
) {
  // 옷장 의상을 입었으면 단계 기본 복장·직업 악센트보다 우선(플레이어 선택 존중)
  const o = outfitOverride ?? applyJobOutfit(cfg.outfit, cfg, jobType);
  const { tl, tr, torsoTop, torsoBot } = A;

  // 목
  set(g, 7, A.chin + 1, "F");
  set(g, 8, A.chin + 1, "F");

  // 몸통(셔츠/재킷 기본)
  fillRect(g, tl, tr, torsoTop, torsoBot, o.base);

  // 가로 줄무늬(옷장: 줄무늬 티) — 몸통 중간에 2줄
  if (o.stripe) {
    const tone = o.base === "F" ? "S" : "F";
    fillRect(g, tl, tr, torsoTop + 1, torsoTop + 1, tone);
    fillRect(g, tl, tr, torsoTop + 3, torsoTop + 3, tone);
  }

  // 재킷: 양 옆 S, 가운데 셔츠(F) 띠
  if (o.blazer) {
    fillRect(g, tl, tl + 1, torsoTop, torsoBot, "S");
    fillRect(g, tr - 1, tr, torsoTop, torsoBot, "S");
    fillRect(g, 7, 8, torsoTop, torsoBot, "F");
  }
  // 깃
  if (o.collar) {
    set(g, 6, torsoTop, "K");
    set(g, 9, torsoTop, "K");
    set(g, 7, torsoTop, "F");
    set(g, 8, torsoTop, "F");
  }
  // 넥타이
  if (o.tie) {
    set(g, 7, torsoTop, "K");
    set(g, 8, torsoTop, "K");
    for (let y = torsoTop + 1; y <= torsoBot - 1; y++) set(g, 7, y, "K");
  }
  // 후드 끈
  if (o.hood) {
    set(g, 6, torsoTop, "F");
    set(g, 9, torsoTop, "F");
    set(g, 7, torsoTop + 1, "K");
    set(g, 8, torsoTop + 2, "K");
  }
  // 지퍼 세로줄(옷장: 집업 재킷) — 지퍼 손잡이는 반짝임. 어두운 몸통(K)엔 밝은 스티치
  if (o.zip) {
    const stitch = o.base === "K" ? "S" : "K";
    set(g, 7, torsoTop, "W");
    for (let y = torsoTop + 1; y <= torsoBot - 1; y++) set(g, 7, y, stitch);
  }
  // 책가방 끈(어깨)
  if (o.straps) {
    for (let y = torsoTop; y <= torsoBot - 1; y++) {
      set(g, tl, y, "S");
      set(g, tr, y, "S");
    }
  }
  // 사원증(목걸이 줄 + 카드)
  if (o.badge) {
    set(g, 6, torsoTop + 1, "K");
    set(g, 6, torsoTop + 2, "S");
    set(g, 6, torsoTop + 3, "S");
  }
  // 기저귀(아기는 별도 처리되지만 안전망)
  if (o.diaper) {
    fillRect(g, tl, tr, torsoBot, torsoBot, "F");
  }
  // 치마 플레어(옷장: 원피스) — 허리 벨트 + 플레어 + 밑단 라인으로 실루엣이 읽히게
  if (o.skirt) {
    fillRect(g, tl, tr, torsoBot, torsoBot, "S"); // 허리 라인
    fillRect(g, tl - 1, tr + 1, A.legTop, A.legTop, o.base);
    fillRect(g, tl - 1, tr + 1, A.legTop + 1, A.legTop + 1, "S"); // 밑단 라인
  }
  // 누빔 가로선(옷장: 패딩 점퍼) — 밝은 몸통에 진한 스티치 2줄
  if (o.quilt) {
    fillRect(g, tl, tr, torsoTop + 1, torsoTop + 1, "K");
    fillRect(g, tl, tr, torsoTop + 3, torsoTop + 3, "K");
  }
  // 멜빵끈 + 가슴 패널(옷장: 멜빵바지)
  if (o.bib) {
    fillRect(g, 7, 8, torsoTop, torsoTop + 1, "S");
    set(g, tl, torsoTop, "S");
    set(g, tr, torsoTop, "S");
  }
  // 민소매(옷장: 수영복) — 어깨를 드러내고 목선 라인만 남긴다
  if (o.sleeveless) {
    clear(g, tl, torsoTop);
    clear(g, tr, torsoTop);
    fillRect(g, tl + 1, tr - 1, torsoTop, torsoTop, "K");
  }
  // 세로 줄무늬(옷장: 야구 유니폼)
  if (o.pinstripe) {
    const tone = o.base === "F" ? "K" : "F";
    for (let y = torsoTop; y <= torsoBot; y++) set(g, 7, y, tone);
  }
  // 앞트임 세로 라인 + 단추(옷장: 니트 가디건)
  if (o.cardigan) {
    set(g, 7, torsoTop, "K");
    for (let y = torsoTop + 1; y <= torsoBot; y++) set(g, 7, y, "S");
    set(g, 8, torsoTop + 2, "K");
  }
  // 가슴 패치 포켓(옷장: 청청 세트)
  if (o.denimPatch) {
    set(g, 6, torsoTop + 1, "K");
    fillRect(g, 6, 6, torsoTop + 1, torsoTop + 2, "S");
  }
  // 긴 깃 + 허리 벨트(옷장: 트렌치코트)
  if (o.longCollar) {
    set(g, 6, torsoTop, "K");
    set(g, 9, torsoTop, "K");
    fillRect(g, tl, tr, torsoBot, torsoBot, "K");
  }
  // 브이넥 옷고름(옷장: 한복)
  if (o.hanbokSash) {
    set(g, 7, torsoTop, "K");
    set(g, 8, torsoTop + 1, "K");
    set(g, 7, torsoTop + 2, "S");
  }
  // 보타이 + 라펠(옷장: 턱시도) — 정장의 깃(collar)과 다른 위치·범위라 실루엣이 갈린다
  if (o.lapel) {
    set(g, 6, torsoTop, "K");
    set(g, 7, torsoTop, "K");
    set(g, 8, torsoTop, "K");
    set(g, 9, torsoTop, "K");
  }

  // 팔(포즈별)
  const sleeve = o.base;
  if (pose === "exercise") {
    // 두 팔 위로
    stamp(g, tl - 1, torsoTop - 2, [sleeve, sleeve, sleeve]);
    stamp(g, tr + 1, torsoTop - 2, [sleeve, sleeve, sleeve]);
    set(g, tl - 1, torsoTop - 3, "F"); // 손
    set(g, tr + 1, torsoTop - 3, "F");
  } else if (pose === "sit") {
    // 팔을 앞으로(책상/노트북 쪽)
    set(g, tl - 1, torsoTop + 1, sleeve);
    set(g, tr + 1, torsoTop + 1, sleeve);
    set(g, tl - 1, torsoTop + 2, sleeve);
    set(g, tr + 1, torsoTop + 2, sleeve);
    set(g, tl, torsoBot, "F"); // 앞으로 모은 손
    set(g, tr, torsoBot, "F");
  } else {
    // stand: 양 옆으로 내림
    for (let y = torsoTop; y <= torsoBot - 1; y++) {
      set(g, tl - 1, y, sleeve);
      set(g, tr + 1, y, sleeve);
    }
    set(g, tl - 1, torsoBot, "F"); // 손
    set(g, tr + 1, torsoBot, "F");
  }

  // 체형 반영 — heavy: 하반 몸통이 옆으로 불룩 / slim: 어깨·허리 모서리를 깎아 갸름하게
  if (bodyShape === "heavy") {
    const bellyTop = torsoTop + Math.ceil((torsoBot - torsoTop) / 2);
    for (let y = bellyTop; y <= torsoBot; y++) {
      set(g, tl - 1, y, o.base);
      set(g, tr + 1, y, o.base);
    }
    if (pose === "stand") {
      set(g, tl - 1, torsoBot, "F"); // 배에 덮인 손 복원
      set(g, tr + 1, torsoBot, "F");
    }
  } else if (bodyShape === "slim" && pose !== "sit") {
    clear(g, tl, torsoTop);
    clear(g, tr, torsoTop);
    clear(g, tl, torsoBot);
    clear(g, tr, torsoBot);
  }
}

function applyJobOutfit(o: Outfit, cfg: StageVisualConfig, jobType: JobType): Outfit {
  // 직장인/경력직만 직업 악센트 적용
  if (cfg.tier !== "full" && cfg.outfit.blazer !== true && !cfg.outfit.badge)
    return o;
  const next: Outfit = { ...o };
  if (jobType === "tech") {
    next.tie = false;
    next.hood = true;
    next.base = "S";
  } else if (jobType === "creative") {
    next.tie = false;
    next.base = "S";
  } else if (jobType === "physical") {
    next.tie = false;
    next.blazer = false;
    next.base = "F";
  }
  return next;
}

// ---------------------------------------------------------------------------
// 다리(포즈별)
// ---------------------------------------------------------------------------

function drawLegs(g: Grid, A: Anchor, pose: PoseKey, cfg: StageVisualConfig) {
  const { legTop, legBot, tl, tr } = A;
  const pants = "S"; // 바지/하의는 중간 톤

  if (pose === "sit") {
    // 앉은 자세: 허벅지(가로) + 발 모음
    fillRect(g, tl, tr, legTop, legTop + 1, "S");
    set(g, tl + 1, legTop + 2, "K");
    set(g, tr - 1, legTop + 2, "K");
    return;
  }
  if (pose === "exercise") {
    // 다리 벌린 스탠스
    for (let y = legTop; y <= legBot - 1; y++) {
      set(g, tl, y, pants);
      set(g, tr, y, pants);
    }
    set(g, tl, legBot, "K");
    set(g, tr, legBot, "K");
    return;
  }
  // stand: 두 다리(몸통 양 끝 아래로, 가운데는 비워 분리)
  const narrow = tr - tl <= 3;
  const legCols = narrow ? [[tl], [tr]] : [[tl, tl + 1], [tr - 1, tr]];
  for (const grp of legCols) {
    for (const x of grp) {
      for (let y = legTop; y <= legBot - 1; y++) set(g, x, y, pants);
      set(g, x, legBot, "K"); // 신발
    }
  }
}

// ---------------------------------------------------------------------------
// 소품(손/책상)
// ---------------------------------------------------------------------------

function drawProps(g: Grid, vs: CharacterVisualState, A: Anchor, cfg: StageVisualConfig) {
  const prop = vs.prop !== "none" ? vs.prop : cfg.stageProp;
  const lapY = A.legTop - 1;

  switch (prop) {
    case "book": {
      // 펼친 노트 + 연필
      stamp(g, 5, lapY, ["KKKKKK", "FKFFKF"]);
      set(g, 11, lapY - 1, "S"); // 연필
      set(g, 11, lapY, "K");
      break;
    }
    case "laptop": {
      stamp(g, 5, lapY - 1, ["SSSSSS", "KFFFFK"]);
      set(g, 5, lapY, "K");
      set(g, 10, lapY, "K");
      break;
    }
    case "coffee": {
      set(g, 3, A.torsoBot - 1, "S");
      set(g, 3, A.torsoBot, "K");
      set(g, 2, A.torsoBot - 1, "K"); // 손잡이
      break;
    }
    case "dumbbell": {
      // 위로 든 손 옆 작은 아령
      set(g, A.tl - 2, A.torsoTop - 3, "K");
      set(g, A.tr + 2, A.torsoTop - 3, "K");
      break;
    }
    case "bag": {
      // 등 뒤 책가방
      stamp(g, A.tr + 1, A.torsoTop + 1, ["S", "S", "K"]);
      break;
    }
    case "file": {
      // 손에 든 서류
      stamp(g, 6, A.torsoBot, ["FFFF", "KKKK"]);
      break;
    }
    case "toy": {
      // 작은 공
      set(g, 11, A.torsoBot, "S");
      set(g, 12, A.torsoBot, "K");
      set(g, 11, A.torsoBot - 1, "K");
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// 오버레이(머리 위 아이콘)
// ---------------------------------------------------------------------------

function drawOverlays(g: Grid, vs: CharacterVisualState) {
  for (const ov of vs.overlays) {
    switch (ov) {
      case "zzz":
        stamp(g, 11, 0, ["KKK", ".K.", "KKK"]);
        set(g, 14, 2, "K");
        set(g, 14, 3, "K");
        break;
      case "cloud":
        stamp(g, 4, 0, [".SSSSSS.", "SSSSSSSS"]);
        set(g, 5, 2, "K");
        set(g, 8, 2, "K");
        set(g, 11, 2, "K");
        break;
      case "sweat":
        set(g, 11, 2, "W");
        set(g, 11, 3, "K");
        break;
      case "hungerBubble":
        stamp(g, 11, 0, ["FFFF", "FKKF", "FFFF"]);
        set(g, 11, 3, "F");
        break;
      case "sparkle":
        set(g, 12, 1, "W");
        set(g, 11, 2, "K");
        set(g, 13, 2, "K");
        set(g, 12, 3, "K");
        set(g, 3, 2, "W");
        break;
      case "bandage":
        set(g, 10, 4, "K"); // 볼 밴드
        set(g, 9, 4, "F");
        break;
      case "stink": // 왼쪽 위 냄새 아지랑이(지그재그 2줄)
        set(g, 2, 0, "S");
        set(g, 1, 1, "S");
        set(g, 2, 2, "S");
        set(g, 3, 1, "S");
        set(g, 3, 3, "S");
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// 아기(별도 컴팩트 조립)
// ---------------------------------------------------------------------------

function drawBaby(
  g: Grid,
  vs: CharacterVisualState,
  appearance: CharacterAppearance = DEFAULT_APPEARANCE,
) {
  // 큰 머리 cols 4-11, rows 2-8
  stamp(g, 4, 2, [
    "..FFFF..",
    ".FFFFFF.",
    "FFFFFFFF",
    "FFFFFFFF",
    "FFFFFFFF",
    ".FFFFFF.",
    "..FFFF..",
  ]);
  // 머리 한 줌(캐릭터별 톤)
  const tone = appearance.hairTone === "light" ? "S" : "K";
  set(g, 7, 1, tone);
  set(g, 8, 1, tone);
  // 얼굴: 눈 rows 5, 입 rows 7
  const A: Anchor = {
    headTop: 2,
    eyesRow: 5,
    mouthRow: 7,
    chin: 8,
    torsoTop: 9,
    torsoBot: 11,
    legTop: 12,
    legBot: 12,
    tl: 5,
    tr: 10,
  };
  // 아기 눈은 좀 더 안쪽
  if (vs.expression === "sleepy" || vs.expression === "sick" || vs.expression === "tired") {
    set(g, 5, 5, "K");
    set(g, 6, 5, "K");
    set(g, 9, 5, "K");
    set(g, 10, 5, "K");
  } else {
    set(g, 6, 5, "K");
    set(g, 9, 5, "K");
  }
  // 입
  if (vs.expression === "happy") {
    set(g, 6, 7, "K");
    set(g, 9, 7, "K");
    set(g, 7, 8, "K");
    set(g, 8, 8, "K");
  } else if (vs.expression === "hungry" || vs.expression === "sad") {
    set(g, 7, 7, "K");
    set(g, 8, 7, "K");
    set(g, 7, 8, "K");
    set(g, 8, 8, "K");
  } else {
    set(g, 7, 7, "K");
    set(g, 8, 7, "K");
  }
  // 통통한 몸(우주복/기저귀)
  fillRect(g, 5, 10, 9, 11, "F");
  fillRect(g, 5, 10, 12, 12, "S"); // 기저귀
  // 짧은 팔
  set(g, 4, 10, "F");
  set(g, 11, 10, "F");
  if (appearance.glasses) drawGlasses(g, A);
  drawFaceAccent(g, A, appearance.faceAccent, 6); // 아기 볼은 눈(5)보다 한 칸 아래
  drawProps(g, vs, A, STAGE_CONFIG.baby);
  drawOverlays(g, vs);
}

// ---------------------------------------------------------------------------
// 누운 자세(수면)
// ---------------------------------------------------------------------------

function drawLying(
  g: Grid,
  vs: CharacterVisualState,
  cfg: StageVisualConfig,
  appearance: CharacterAppearance = DEFAULT_APPEARANCE,
) {
  const baseY = 13;
  // 베개
  fillRect(g, 1, 3, baseY, baseY + 2, "F");
  set(g, 1, baseY - 1, "S");
  // 머리(왼쪽)
  stamp(g, 3, baseY - 1, [".FFF.", "FFFFF", "FFFFF", ".FFF."]);
  // 머리카락(캐릭터별 톤, senior 는 항상 흰머리)
  const hair =
    cfg.hair === "senior" ? "S" : appearance.hairTone === "light" ? "S" : "K";
  set(g, 3, baseY - 1, hair);
  set(g, 4, baseY - 1, hair);
  // 감은 눈 + 작은 입
  set(g, 5, baseY + 1, "K");
  set(g, 6, baseY + 1, "K");
  set(g, 5, baseY + 2, "K");
  // 이불(몸)
  fillRect(g, 7, 14, baseY + 1, baseY + 3, "S");
  stamp(g, 7, baseY, ["SSSSSSSS"]);
  set(g, 14, baseY + 1, "F"); // 발끝
  // 침대 프레임 라인
  fillRect(g, 1, 15, baseY + 4, baseY + 4, "K");
  // Z
  stamp(g, 9, baseY - 5, ["KKK", ".K.", "KKK"]);
  set(g, 12, baseY - 3, "K");
}

// ---------------------------------------------------------------------------
// 조립 진입점
// ---------------------------------------------------------------------------

export function buildCharacterMatrix(
  vs: CharacterVisualState,
  lifeStage: LifeStage,
  jobType: JobType = "none",
  gender?: Gender,
  appearance: CharacterAppearance = DEFAULT_APPEARANCE,
  bodyShape: BodyShape = "normal",
  wardrobe?: EquippedWardrobe,
): string[] {
  const cfg = STAGE_CONFIG[lifeStage];
  const g = blank();

  if (cfg.tier === "tiny") {
    drawBaby(g, vs, appearance);
    return g.map((r) => r.join(""));
  }

  if (vs.pose === "lie") {
    drawLying(g, vs, cfg, appearance);
    return g.map((r) => r.join(""));
  }

  const outfitOverride = wardrobe?.outfit ? WARDROBE_OUTFITS[wardrobe.outfit] : undefined;

  const A = anchorFor(cfg.tier);
  // 순서: 다리 → 몸통/팔 → 머리/표정 → 안경(눈 위 덧그림) → 볼 포인트 → 액세서리 → 소품 → 오버레이
  drawLegs(g, A, vs.pose, cfg);
  drawBody(g, A, cfg, vs.pose, jobType, bodyShape, outfitOverride);
  drawHead(g, A, cfg, gender, appearance);
  if (bodyShape === "heavy") {
    set(g, 4, A.eyesRow + 1, "F"); // 통통한 볼(얼굴 폭 +1)
    set(g, 11, A.eyesRow + 1, "F");
  }
  drawFace(g, vs.expression, A);
  if (appearance.glasses) drawGlasses(g, A);
  drawFaceAccent(g, A, appearance.faceAccent);
  if (wardrobe?.accessory) drawAccessory(g, A, wardrobe.accessory);
  drawProps(g, vs, A, cfg);
  drawOverlays(g, vs);

  return g.map((r) => r.join(""));
}

export interface PixelCell {
  x: number;
  y: number;
  code: string;
}

export function matrixToCells(matrix: string[]): PixelCell[] {
  const cells: PixelCell[] = [];
  matrix.forEach((row, y) =>
    row.split("").forEach((code, x) => {
      if (code !== ".") cells.push({ x, y, code });
    }),
  );
  return cells;
}
