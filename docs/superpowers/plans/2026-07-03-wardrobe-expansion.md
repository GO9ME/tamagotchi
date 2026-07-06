# 옷장 16→32종 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 옷장 아이템을 16종(의상 8+액세서리 8)에서 32종(의상 16+액세서리 16)으로 늘리고, 신규 의상 8종은 픽셀 스프라이트에 실제로 반영되도록 새 `Outfit` 트레잇을 추가한다.

**Architecture:** `lib/game/wardrobe.ts`의 `WARDROBE_ITEMS` 카탈로그에 16개 항목을 추가한다(가격 오름차순 불변식 테스트가 있으므로 기존 항목과 병합 정렬된 위치에 삽입). 스프라이트는 `lib/game/sprite/characterStageConfig.ts`의 `Outfit` 인터페이스에 새 트레잇 플래그를 추가하고, `drawBody`가 그 플래그를 해석하는 분기를 추가하는 방식이다(기존 `stripe`/`zip`/`skirt`/`quilt`와 동일한 패턴). 액세서리는 `drawAccessory`의 `switch(key)`에 케이스를 추가한다.

**Tech Stack:** TypeScript, Vitest, Next.js/React

**참고 스펙:** [docs/superpowers/specs/2026-07-03-play-gacha-expansion-design.md](../specs/2026-07-03-play-gacha-expansion-design.md) 섹션 B

---

### Task 1: `WardrobeItemKey` 타입에 신규 16종 추가

**Files:**
- Modify: `types/character.ts:78-97`

- [ ] **Step 1: 유니언 확장**

`types/character.ts`에서 아래 블록을 찾는다:

```ts
/** 옷장 아이템 키 — 의상(몸통 교체) 또는 액세서리(머리/목 덧그리기) */
export type WardrobeItemKey =
  // 의상 — 착용 시 성장 단계 기본 복장을 대체(직업 악센트보다 우선)
  | "stripeTee" // 줄무늬 티
  | "hoodie" // 후드티
  | "jacket" // 집업 재킷
  | "suit" // 정장
  | "training" // 트레이닝복
  | "dress" // 원피스
  | "padding" // 패딩 점퍼
  | "leather" // 가죽 재킷
  // 액세서리 — 복장과 별개로 1개 착용
  | "ribbon" // 리본핀
  | "cap" // 캡모자
  | "beanie" // 비니
  | "scarf" // 목도리
  | "sunglasses" // 선글라스
  | "headphones" // 헤드폰
  | "necklace" // 목걸이
  | "crown"; // 왕관
```

다음으로 교체한다:

```ts
/** 옷장 아이템 키 — 의상(몸통 교체) 또는 액세서리(머리/목 덧그리기) */
export type WardrobeItemKey =
  // 의상 — 착용 시 성장 단계 기본 복장을 대체(직업 악센트보다 우선)
  | "stripeTee" // 줄무늬 티
  | "hoodie" // 후드티
  | "jacket" // 집업 재킷
  | "suit" // 정장
  | "training" // 트레이닝복
  | "dress" // 원피스
  | "padding" // 패딩 점퍼
  | "leather" // 가죽 재킷
  | "overalls" // 멜빵바지
  | "swimsuit" // 수영복
  | "baseballUniform" // 야구 유니폼
  | "knitCardigan" // 니트 가디건
  | "denimSet" // 청청 세트
  | "trenchCoat" // 트렌치코트
  | "hanbok" // 한복
  | "tuxedo" // 턱시도
  // 액세서리 — 복장과 별개로 1개 착용
  | "ribbon" // 리본핀
  | "cap" // 캡모자
  | "beanie" // 비니
  | "scarf" // 목도리
  | "sunglasses" // 선글라스
  | "headphones" // 헤드폰
  | "necklace" // 목걸이
  | "crown" // 왕관
  | "hairpin" // 헤어핀 세트
  | "gloves" // 장갑
  | "bowtie" // 나비넥타이
  | "backpack" // 백팩
  | "watch" // 손목시계
  | "earrings" // 귀걸이
  | "brooch" // 브로치
  | "anklet"; // 발찌
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add types/character.ts
git commit -m "feat: WardrobeItemKey에 의상 8종, 액세서리 8종 추가"
```

---

### Task 2: `WARDROBE_ITEMS` 카탈로그에 신규 16종 추가

**Files:**
- Modify: `lib/game/wardrobe.ts:26-43`

기존 "kind별 가격 오름차순" 불변식 테스트(`wardrobe.test.ts`)를 깨지 않으려면, 새 항목을 배열 끝에 붙이는 게 아니라 같은 kind 안에서 가격 오름차순이 되도록 병합된 위치에 삽입해야 한다.

- [ ] **Step 1: `WARDROBE_ITEMS` 배열 전체 교체**

`lib/game/wardrobe.ts`에서 아래 블록을 찾는다:

```ts
/** kind별 가격 오름차순 — 실제 물가 기준(만원) */
export const WARDROBE_ITEMS: WardrobeDef[] = [
  { key: "stripeTee", kind: "outfit", label: "줄무늬 티", emoji: "👕", price: 2, minAge: 8, desc: "만만하게 손이 가는 데일리룩" },
  { key: "training", kind: "outfit", label: "트레이닝복", emoji: "🎽", price: 5, minAge: 8, desc: "운동할 맛 나는 셋업" },
  { key: "hoodie", kind: "outfit", label: "후드티", emoji: "🧥", price: 6, minAge: 8, desc: "편안함의 정점" },
  { key: "dress", kind: "outfit", label: "원피스", emoji: "👗", price: 8, minAge: 8, desc: "빙글 돌면 살랑, 나들이룩" },
  { key: "jacket", kind: "outfit", label: "집업 재킷", emoji: "🧷", price: 12, minAge: 13, desc: "각 잡힌 어깨 라인" },
  { key: "padding", kind: "outfit", label: "패딩 점퍼", emoji: "❄️", price: 15, minAge: 8, desc: "한겨울에도 뽀송뽀송" },
  { key: "leather", kind: "outfit", label: "가죽 재킷", emoji: "🖤", price: 25, minAge: 17, desc: "락스피릿 충전" },
  { key: "suit", kind: "outfit", label: "정장", emoji: "🤵", price: 40, minAge: 17, desc: "중요한 날의 승부복" },
  { key: "ribbon", kind: "accessory", label: "리본핀", emoji: "🎀", price: 1, minAge: 4, desc: "머리에 포인트 하나" },
  { key: "beanie", kind: "accessory", label: "비니", emoji: "🧶", price: 2, minAge: 8, desc: "겨울 필수템" },
  { key: "cap", kind: "accessory", label: "캡모자", emoji: "🧢", price: 3, minAge: 8, desc: "눌러쓰면 스트릿 무드" },
  { key: "scarf", kind: "accessory", label: "목도리", emoji: "🧣", price: 4, minAge: 8, desc: "포근하게 목을 감싸요" },
  { key: "sunglasses", kind: "accessory", label: "선글라스", emoji: "🕶️", price: 5, minAge: 8, desc: "간지 +100" },
  { key: "headphones", kind: "accessory", label: "헤드폰", emoji: "🎧", price: 7, minAge: 8, desc: "음악과 함께라면" },
  { key: "necklace", kind: "accessory", label: "목걸이", emoji: "📿", price: 10, minAge: 13, desc: "은은한 반짝임 포인트" },
  { key: "crown", kind: "accessory", label: "왕관", emoji: "👑", price: 50, minAge: 4, desc: "오늘의 주인공은 나야 나" },
];
```

다음으로 교체한다(각 kind 안에서 가격 오름차순으로 신규 항목을 병합):

```ts
/** kind별 가격 오름차순 — 실제 물가 기준(만원) */
export const WARDROBE_ITEMS: WardrobeDef[] = [
  { key: "stripeTee", kind: "outfit", label: "줄무늬 티", emoji: "👕", price: 2, minAge: 8, desc: "만만하게 손이 가는 데일리룩" },
  { key: "overalls", kind: "outfit", label: "멜빵바지", emoji: "👖", price: 4, minAge: 8, desc: "편하게 뛰어놀기 좋은 멜빵바지" },
  { key: "training", kind: "outfit", label: "트레이닝복", emoji: "🎽", price: 5, minAge: 8, desc: "운동할 맛 나는 셋업" },
  { key: "hoodie", kind: "outfit", label: "후드티", emoji: "🧥", price: 6, minAge: 8, desc: "편안함의 정점" },
  { key: "swimsuit", kind: "outfit", label: "수영복", emoji: "🏖️", price: 6, minAge: 8, desc: "여름은 물놀이의 계절" },
  { key: "baseballUniform", kind: "outfit", label: "야구 유니폼", emoji: "⚾", price: 7, minAge: 8, desc: "오늘의 포지션은 해피니스" },
  { key: "dress", kind: "outfit", label: "원피스", emoji: "👗", price: 8, minAge: 8, desc: "빙글 돌면 살랑, 나들이룩" },
  { key: "knitCardigan", kind: "outfit", label: "니트 가디건", emoji: "🪢", price: 9, minAge: 8, desc: "가을엔 역시 가디건 하나" },
  { key: "denimSet", kind: "outfit", label: "청청 세트", emoji: "🪡", price: 11, minAge: 13, desc: "청바지엔 청재킷이 국룰" },
  { key: "jacket", kind: "outfit", label: "집업 재킷", emoji: "🧷", price: 12, minAge: 13, desc: "각 잡힌 어깨 라인" },
  { key: "padding", kind: "outfit", label: "패딩 점퍼", emoji: "❄️", price: 15, minAge: 8, desc: "한겨울에도 뽀송뽀송" },
  { key: "trenchCoat", kind: "outfit", label: "트렌치코트", emoji: "🌂", price: 18, minAge: 13, desc: "비 오는 날엔 트렌치코트" },
  { key: "hanbok", kind: "outfit", label: "한복", emoji: "👘", price: 20, minAge: 8, desc: "명절엔 역시 한복이죠" },
  { key: "leather", kind: "outfit", label: "가죽 재킷", emoji: "🖤", price: 25, minAge: 17, desc: "락스피릿 충전" },
  { key: "suit", kind: "outfit", label: "정장", emoji: "🤵", price: 40, minAge: 17, desc: "중요한 날의 승부복" },
  { key: "tuxedo", kind: "outfit", label: "턱시도", emoji: "🎩", price: 45, minAge: 20, desc: "포멀의 정점, 턱시도" },
  { key: "ribbon", kind: "accessory", label: "리본핀", emoji: "🎀", price: 1, minAge: 4, desc: "머리에 포인트 하나" },
  { key: "hairpin", kind: "accessory", label: "헤어핀 세트", emoji: "📎", price: 1, minAge: 4, desc: "포인트 살리는 헤어핀" },
  { key: "beanie", kind: "accessory", label: "비니", emoji: "🧶", price: 2, minAge: 8, desc: "겨울 필수템" },
  { key: "cap", kind: "accessory", label: "캡모자", emoji: "🧢", price: 3, minAge: 8, desc: "눌러쓰면 스트릿 무드" },
  { key: "gloves", kind: "accessory", label: "장갑", emoji: "🧤", price: 3, minAge: 8, desc: "손끝까지 따뜻하게" },
  { key: "scarf", kind: "accessory", label: "목도리", emoji: "🧣", price: 4, minAge: 8, desc: "포근하게 목을 감싸요" },
  { key: "bowtie", kind: "accessory", label: "나비넥타이", emoji: "🎗️", price: 4, minAge: 8, desc: "포멀한 자리엔 나비넥타이" },
  { key: "sunglasses", kind: "accessory", label: "선글라스", emoji: "🕶️", price: 5, minAge: 8, desc: "간지 +100" },
  { key: "headphones", kind: "accessory", label: "헤드폰", emoji: "🎧", price: 7, minAge: 8, desc: "음악과 함께라면" },
  { key: "backpack", kind: "accessory", label: "백팩", emoji: "🎒", price: 8, minAge: 8, desc: "책이며 간식이며 다 들어가요" },
  { key: "watch", kind: "accessory", label: "손목시계", emoji: "⌚", price: 9, minAge: 13, desc: "시간도 스타일도 놓치지 않기" },
  { key: "necklace", kind: "accessory", label: "목걸이", emoji: "📿", price: 10, minAge: 13, desc: "은은한 반짝임 포인트" },
  { key: "earrings", kind: "accessory", label: "귀걸이", emoji: "💎", price: 12, minAge: 13, desc: "반짝이는 포인트 하나 더" },
  { key: "brooch", kind: "accessory", label: "브로치", emoji: "🌸", price: 15, minAge: 17, desc: "옷깃에 다는 작은 사치" },
  { key: "anklet", kind: "accessory", label: "발찌", emoji: "⛓️", price: 20, minAge: 17, desc: "은근하게 반짝이는 발목" },
  { key: "crown", kind: "accessory", label: "왕관", emoji: "👑", price: 50, minAge: 4, desc: "오늘의 주인공은 나야 나" },
];
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 기존 카탈로그 불변식 테스트 실행 — 통과 확인**

Run: `npm test -- wardrobe.test`
Expected: PASS — "키 유일 + kind별 가격 오름차순" 테스트가 32개 항목에 대해서도 통과(위에서 병합 정렬했으므로). 스프라이트 관련 테스트(신규 8종을 아직 안 써서)도 그대로 통과.

- [ ] **Step 4: Commit**

```bash
git add lib/game/wardrobe.ts
git commit -m "feat: 옷장 카탈로그를 32종(의상16+액세서리16)으로 확장"
```

---

### Task 3: 신규 의상 8종 — `Outfit` 트레잇 + `drawBody` 렌더링

**Files:**
- Modify: `lib/game/sprite/characterStageConfig.ts`
- Test: `lib/game/__tests__/wardrobe.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/game/__tests__/wardrobe.test.ts`에서 아래 테스트를 찾는다:

```ts
  it("의상 4종은 기본 복장과 다르고 서로도 다르다", () => {
    const base = matrixWith(null, null);
    const outfits: WardrobeItemKey[] = ["stripeTee", "hoodie", "jacket", "suit"];
    const rendered = outfits.map((o) => matrixWith(o, null));
    // hoodie 는 대학생 기본 복장과 동일 정의(base S + hood)이므로 제외하고 비교
    expect(rendered[0]).not.toBe(base); // stripeTee
    expect(rendered[2]).not.toBe(base); // jacket
    expect(rendered[3]).not.toBe(base); // suit
    expect(new Set(rendered).size).toBe(outfits.length); // 서로 전부 다름
  });
```

바로 다음 줄에 새 테스트를 추가한다:

```ts

  it("신규 의상 8종도 기본 복장과 다르고 서로도 다르다", () => {
    const base = matrixWith(null, null);
    const outfits: WardrobeItemKey[] = [
      "overalls",
      "swimsuit",
      "baseballUniform",
      "knitCardigan",
      "denimSet",
      "trenchCoat",
      "hanbok",
      "tuxedo",
    ];
    const rendered = outfits.map((o) => matrixWith(o, null));
    for (const r of rendered) expect(r).not.toBe(base);
    expect(new Set(rendered).size).toBe(outfits.length);
  });

  it("턱시도는 정장과 실루엣이 다르다(어두운 베이스 + 라펠 vs 밝은 베이스 + 깃/넥타이)", () => {
    expect(matrixWith("tuxedo", null)).not.toBe(matrixWith("suit", null));
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npm test -- wardrobe.test`
Expected: FAIL — `WARDROBE_OUTFITS`에 신규 8종 매핑이 없어 `outfitOverride`가 `undefined`가 되고, 단계 기본 복장으로 렌더링되어 `base`와 동일한 매트릭스가 나온다("신규 의상 8종도 기본 복장과 다르고..." 테스트가 실패).

- [ ] **Step 3: `Outfit` 인터페이스에 신규 트레잇 8개 추가**

`lib/game/sprite/characterStageConfig.ts`에서 아래 블록을 찾는다:

```ts
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
}
```

다음으로 교체한다:

```ts
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
```

- [ ] **Step 4: `WARDROBE_OUTFITS`에 신규 8종 매핑 추가**

같은 파일에서 아래 블록을 찾는다:

```ts
const WARDROBE_OUTFITS: Partial<Record<WardrobeItemKey, Outfit>> = {
  stripeTee: { base: "F", stripe: true },
  hoodie: { base: "S", hood: true },
  jacket: { base: "S", collar: true, zip: true },
  suit: { base: "F", blazer: true, collar: true, tie: true },
  training: { base: "S", zip: true, stripe: true },
  dress: { base: "F", skirt: true },
  padding: { base: "S", quilt: true },
  leather: { base: "K", zip: true },
};
```

다음으로 교체한다:

```ts
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
```

- [ ] **Step 5: `drawBody`에 신규 트레잇 렌더링 분기 추가**

같은 파일에서 아래 블록을 찾는다(패딩 누빔 처리 다음, 팔 렌더링 시작 전):

```ts
  // 누빔 가로선(옷장: 패딩 점퍼) — 밝은 몸통에 진한 스티치 2줄
  if (o.quilt) {
    fillRect(g, tl, tr, torsoTop + 1, torsoTop + 1, "K");
    fillRect(g, tl, tr, torsoTop + 3, torsoTop + 3, "K");
  }

  // 팔(포즈별)
```

다음으로 교체한다:

```ts
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
```

- [ ] **Step 6: 테스트 실행 — 통과 확인**

Run: `npm test -- wardrobe.test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/game/sprite/characterStageConfig.ts lib/game/__tests__/wardrobe.test.ts
git commit -m "feat: 신규 의상 8종의 픽셀 스프라이트 렌더링 추가"
```

---

### Task 4: 신규 액세서리 8종 — `drawAccessory` 렌더링

**Files:**
- Modify: `lib/game/sprite/characterStageConfig.ts`
- Test: `lib/game/__tests__/wardrobe.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/game/__tests__/wardrobe.test.ts`의 "모자(캡/비니)는..." 테스트 바로 다음에 추가한다:

```ts

  it("신규 액세서리 8종도 기본 복장과 다르다", () => {
    const base = matrixWith(null, null);
    const accessories: WardrobeItemKey[] = [
      "hairpin",
      "gloves",
      "bowtie",
      "backpack",
      "watch",
      "earrings",
      "brooch",
      "anklet",
    ];
    for (const a of accessories) {
      expect(matrixWith(null, a)).not.toBe(base);
    }
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npm test -- wardrobe.test`
Expected: FAIL — `drawAccessory`의 `switch(key)`가 신규 8종에 대해 `default: break`로 빠지므로 아무것도 그려지지 않아 `base`와 동일한 매트릭스가 나온다.

- [ ] **Step 3: `drawAccessory`에 신규 8종 케이스 추가**

`lib/game/sprite/characterStageConfig.ts`에서 아래 블록을 찾는다:

```ts
    case "crown": // 왕관 — 머리 위 반짝이 밴드
      for (let x = 5; x <= 10; x++) set(g, x, 0, "W");
      set(g, 5, 1, "W");
      set(g, 10, 1, "W");
      break;
    default:
      break;
  }
}
```

다음으로 교체한다:

```ts
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
      set(g, A.tl, A.torsoTop + 1, "S");
      set(g, A.tr, A.torsoTop + 1, "S");
      set(g, A.tl, A.torsoTop + 2, "S");
      set(g, A.tr, A.torsoTop + 2, "S");
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
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npm test -- wardrobe.test`
Expected: PASS (전체 wardrobe.test.ts 스위트 통과)

- [ ] **Step 5: 타입 체크 + 전체 테스트**

Run: `npx tsc --noEmit && npm test`
Expected: 둘 다 에러 없음/PASS

- [ ] **Step 6: Commit**

```bash
git add lib/game/sprite/characterStageConfig.ts lib/game/__tests__/wardrobe.test.ts
git commit -m "feat: 신규 액세서리 8종의 픽셀 스프라이트 렌더링 추가"
```

---

### Task 5: 개발 서버로 수동 확인

**Files:** (없음 — 수동 QA)

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev`

- [ ] **Step 2: 브라우저에서 확인**

`/dashboard` → 상점 탭 → 옷장 패널에서:
1. 의상 16종, 액세서리 16종이 모두 목록에 보이는지, 나이 게이트가 걸린 항목은 잠금 표시가 뜨는지 확인
2. 신규 의상 8종(멜빵바지/수영복/야구유니폼/니트가디건/청청세트/트렌치코트/한복/턱시도)을 각각 착용해보고 캐릭터 스프라이트가 실제로 바뀌는지, 서로 구분되는지 확인
3. 턱시도와 정장을 번갈아 착용해 실루엣이 다른지 확인
4. 신규 액세서리 8종을 각각 착용해보고 스프라이트에 반영되는지 확인
5. 옷장 뽑기(`GachaPullButton`, category="wardrobe")를 몇 번 실행해 신규 아이템도 뽑히는지 확인

- [ ] **Step 3: 서버 종료**

확인 후 개발 서버를 중지한다.

---

### Task 6: 최종 검증

**Files:** (없음 — 검증만)

- [ ] **Step 1: 전체 테스트 스위트**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: 린트**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 빌드 성공(타입 에러 없음)
