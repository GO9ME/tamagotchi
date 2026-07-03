# 놀이/뽑기 콘텐츠 확장 설계

- 날짜: 2026-07-03
- 상태: 승인됨 (구현 대기)

## 배경 / 목표

라이브 화면(`/dashboard`)의 "놀이" 탭 미니게임이 슬롯머신·행운뽑기 2종뿐이라 금방 반복적으로 느껴지고,
"상점" 탭의 옷장/방꾸미기/자동차 뽑기 중 자동차 뽑기는 전체 후보가 3종(티어당 1대)뿐이라
사실상 뽑을 때마다 결과가 거의 정해져 있다. 이 스펙은 다음을 확장한다:

1. 미니게임 5종 신규 추가(럭 기반 3 + 스킬 기반 2)
2. 옷장 아이템 16→32종
3. 방꾸미기 아이템 14→28종
4. 자동차 3→9종(티어당 3종) + 이를 가능케 하는 자산가치 계산 버그 수정

## 비범위(Non-goals)

- 여가(`leisure.ts`, 쇼핑/맛집/콘서트 등 7종) 활동 자체는 건드리지 않는다 — 이미 최근에 별도로 확장된 시스템이고,
  이번 요청은 "놀이 탭의 랜덤 콘텐츠"(미니게임)와 "뽑기 시스템"에 한정된다.
- 자동차를 방/스프라이트에 시각적으로 렌더링하는 기능(현재도 없음, 텍스트+이모지 리스트로만 표시)은 추가하지 않는다.
- 자동차 티어를 4단계 이상으로 늘리지 않는다(티어당 종류만 늘림).
- persist 스키마 버전 증가 없음 — 모든 변경은 기존 유니언 타입/배열 필드에 대한 순수 추가이므로 기존 세이브와 호환된다.

---

## A. 미니게임 5종 신규 추가

`lib/game/minigame.ts`의 `MinigameKind`에 5개 추가: `"roulette" | "fishing" | "darts" | "rps" | "timing"`.
기존 슬롯머신(`slots`)·행운뽑기(`gacha`)와 동일하게 `MINIGAME_ENERGY_COST`(체력 12) 소모, 쿨타임 없음,
`MINIGAME_MIN_AGE`(6세) 이상 해금, 플레이 시 `LUCK_PER_PLAY`만큼 행운 스탯 축적 규칙을 그대로 따른다.

| kind | 라벨 | 타입 | 보상 포커스 | 판정 입력 | 비고 |
|---|---|---|---|---|---|
| `roulette` | 🎡 룰렛 | 럭 | 저축금 + 스트레스 해소(슬롯보다 변동폭 큼) | `rand: number` | `luckBonus(c)`로 대박 확률 보정 |
| `fishing` | 🎣 낚시 | 럭 | 저축금 + exp, "월척"이 최상위 등급 | `rand: number` | 등급 4단계(꽝/붕어/잉어/월척) |
| `darts` | 🎯 다트 | 럭 | 스탯(집중력/자신감) — 돈 보상 없음 | `rand: number` | 슬롯/룰렛/낚시와 보상 종류를 분리해 "돈만 버는 콘텐츠"로 수렴하지 않게 함 |
| `rps` | ✊ 가위바위보 | 스킬 | 자신감/기분, 승/무/패 3분기 | `userChoice: "rock"\|"paper"\|"scissors"`, `rand: number`(CPU 패 결정) | 유저 선택 vs 랜덤 CPU — 기존 `playX(c, rand)` 순수함수 패턴 재사용 |
| `timing` | ⏱️ 타이밍 챌린지 | 스킬 | 집중력 + exp, 정확도 3단계(퍼펙트/굿/미스) | `accuracy: number`(0~1, UI가 계산해서 전달) | UI 컴포넌트가 이동하는 바의 정지 시점을 계산해 정확도를 넘김. 게임 로직 함수 자체는 여전히 순수함수(정확도만 받음) — `Date.now()`/타이머는 컴포넌트 레벨에만 존재 |

**보상 함수 시그니처 예시** (기존 `playSlots(c, rand)` / `playGacha(c, rand, rand2)` 패턴과 동일한 스타일):

```ts
export function playRoulette(c: Character, rand: number): MinigameResult;
export function playFishing(c: Character, rand: number): MinigameResult;
export function playDarts(c: Character, rand: number): MinigameResult;
export function playRps(c: Character, userChoice: RpsChoice, rand: number): MinigameResult;
export function playTiming(c: Character, accuracy: number): MinigameResult;
```

**스토어 변경** (`lib/store/useGameStore.ts`):
`playMinigame: (kind: MinigameKind) => ActionResult` 시그니처를
`playMinigame: (kind: MinigameKind, extra?: { choice?: RpsChoice; accuracy?: number }) => ActionResult`로 확장하고,
`kind`에 따라 대응하는 `playX` 함수로 분기한다. 기존 `slots`/`gacha` 분기는 그대로 유지.

**UI 변경** (`components/minigame/MinigamePanel.tsx`):
`GAMES` 배열에 5개 항목 추가(4×2 그리드로 조정). `rps`는 클릭 시 3버튼(✊✋✌️) 선택 모달/인라인 노출 후 결과 표시.
`timing`은 CSS 애니메이션으로 좌우 이동하는 마커 + "정지" 버튼 — 정지 시각과 애니메이션 진행률로 정확도 계산 후 스토어 액션 호출.
나머지 3종(룰렛/낚시/다트)은 기존 슬롯/캡슐과 동일하게 버튼 클릭 → 즉시 결과 표시.

---

## B. 옷장 16→32종 (`lib/game/wardrobe.ts`)

기존 8 의상 + 8 액세서리에 아래 각 8종씩 추가(가격 단위 만원, 기존 가격대 2~40/1~50과 겹치도록 배치):

### 의상(outfit) 신규 8종

| key | label | emoji | price | minAge | desc |
|---|---|---|---|---|---|
| `overalls` | 멜빵바지 | 👖 | 4 | 8 | 편하게 뛰어놀기 좋은 멜빵바지 |
| `swimsuit` | 수영복 | 🏖️ | 6 | 8 | 여름은 물놀이의 계절 |
| `baseballUniform` | 야구 유니폼 | ⚾ | 7 | 8 | 오늘의 포지션은 해피니스 |
| `knitCardigan` | 니트 가디건 | 🪢 | 9 | 8 | 가을엔 역시 가디건 하나 |
| `denimSet` | 청청 세트 | 🪡 | 11 | 13 | 청바지엔 청재킷이 국룰 |
| `trenchCoat` | 트렌치코트 | 🌂 | 18 | 13 | 비 오는 날엔 트렌치코트 |
| `hanbok` | 한복 | 👘 | 20 | 8 | 명절엔 역시 한복이죠 |
| `tuxedo` | 턱시도 | 🎩 | 45 | 20 | 포멀의 정점, 턱시도 |

### 액세서리(accessory) 신규 8종

| key | label | emoji | price | minAge | desc |
|---|---|---|---|---|---|
| `hairpin` | 헤어핀 세트 | 📎 | 1 | 4 | 포인트 살리는 헤어핀 |
| `gloves` | 장갑 | 🧤 | 3 | 8 | 손끝까지 따뜻하게 |
| `bowtie` | 나비넥타이 | 🎗️ | 4 | 8 | 포멀한 자리엔 나비넥타이 |
| `backpack` | 백팩 | 🎒 | 8 | 8 | 책이며 간식이며 다 들어가요 |
| `watch` | 손목시계 | ⌚ | 9 | 13 | 시간도 스타일도 놓치지 않기 |
| `earrings` | 귀걸이 | 💎 | 12 | 13 | 반짝이는 포인트 하나 더 |
| `brooch` | 브로치 | 🌸 | 15 | 17 | 옷깃에 다는 작은 사치 |
| `anklet` | 발찌 | ⛓️ | 20 | 17 | 은근하게 반짝이는 발목 |

`types/character.ts`의 `WardrobeItemKey` 유니언에 위 16개 키 추가.

**스프라이트 반영 방식** — `lib/game/sprite/characterStageConfig.ts`의 옷은 완전 자유형 그림이 아니라
`Outfit` 트레잇 조합(`base: "F"|"S"`, `stripe`, `hood`, `collar`, `tie`, `blazer`, `straps`, `diaper` 등)을
`drawBody`가 픽셀 그리드로 해석하는 방식이다. 신규 8종 중:
- 기존 트레잇 조합으로 표현 가능한 것(예: 멜빵바지→`straps`, 야구유니폼→`stripe` 변형, 니트가디건→`hood` 없는 `blazer`류)은 `WARDROBE_OUTFITS`에 조합만 추가.
- 기존 트레잇으로 표현 불가능한 것(한복·수영복·턱시도·트렌치코트·청청세트 등 실루엣 자체가 다른 의상)은 `Outfit` 타입에 새 트레잇 플래그를 추가하고 `drawBody`의 픽셀 렌더링 분기도 함께 확장해야 한다.
- 사용자가 "전적 맞춤 픽셀아트로 진행"을 선택했으므로, 8종 전부 실제 실루엣이 구분되도록 필요한 만큼 신규 트레잇을 추가한다(트레잇 재사용으로 때우지 않는다).

액세서리 8종은 `drawAccessory` 함수에 아이템별 픽셀 오버레이를 추가하는 방식으로, 의상보다 상대적으로 공수가 적다(기존 8종도 같은 함수에 개별 분기로 그려져 있음).

---

## C. 방꾸미기 14→28종 (`lib/game/roomItems.ts`)

기존 가격대(50~1200만원) 양끝을 확장하며 14종 추가:

| key | label | emoji | price | desc |
|---|---|---|---|---|
| `candleSet` | 캔들 세트 | 🕯️ | 40 | 은은한 향과 조명 |
| `succulents` | 다육식물 화분 | 🌵 | 70 | 손 안 가는 초록이 |
| `bookshelf` | 미니 책장 | 📚 | 90 | 책 좀 읽는 사람 컨셉 |
| `moodLamp` | 무드등 | 🌙 | 110 | 밤엔 은은하게 |
| `teddyBear` | 곰인형 | 🧸 | 130 | 포근한 방 친구 |
| `dartboard` | 다트보드 | 🎯 | 160 | 벽에 거는 승부욕 |
| `turntable` | 턴테이블 | 📻 | 250 | 아날로그 감성 가득 |
| `vanity` | 화장대 | 🪞 | 260 | 거울 앞에서 꾸미는 시간 |
| `miniFridge` | 미니 냉장고 | 🧊 | 350 | 방에서 시원한 음료 한 잔 |
| `airConditioner` | 에어컨 | 🌬️ | 450 | 여름 나기의 필수템 |
| `massageChair` | 안마의자 | 💺 | 700 | 퇴근 후 완벽한 휴식 |
| `bigAquarium` | 대형 수족관 | 🐠 | 900 | 물고기 여러 마리가 사는 방 |
| `homeTheater` | 홈시어터 | 🎬 | 1100 | 극장이 부럽지 않은 사운드 |
| `grandPiano` | 그랜드 피아노 | 🎹 | 1400 | 방 안의 콘서트홀 |

`types/character.ts`의 `RoomItemKey` 유니언에 위 14개 키 추가.

**렌더링 방식** — `PixelRoom.tsx`의 `OwnedItems`는 이모지가 아니라 아이템마다 `has("key") && (...)` 분기로
절대좌표(`left`/`bottom`/`top` %) + 색상(`ink`/`prop`/`propHi` 팔레트) + 도형(`border`, `borderRadius`, `clipPath`)을
직접 지정하는 손그림 CSS 픽셀아트다. 신규 14종도 동일한 패턴으로 각각:
1. 기존 13종(캐릭터·가구)과 겹치지 않는 빈 좌표를 찾아 배치
2. 방은 인생 단계별로 배경이 7종(`nursery`/`kidRoom`/`studyRoom`/`campus`/`jobseekerRoom`/`office`/`seniorOffice`)이므로, 모든 배경에서 위화감 없이 보이는지 확인
3. 기존 아이템과 동일한 팔레트 변수·테두리 두께 스타일을 재사용해 톤을 맞춤

사용자가 "전적 맞춤 픽셀아트로 진행"을 선택했으므로 14종 전부 이 방식으로 개별 제작한다 — 이번 확장에서 가장 반복 작업량이 많은 부분(좌표 조정 → 시각 확인 → 재조정 사이클이 아이템마다 필요).

---

## D. 자동차 뽑기 — 티어당 3종(총 9종) + 자산가치 계산 버그 수정

### D-1. 신규 자동차 목록 (`lib/game/assets.ts`의 `ASSETS`)

| key | tier | label | emoji | price | desc |
|---|---|---|---|---|---|
| `carCompact`(기존) | 1 | 경차 | 🚗 | 2000 | 나의 첫 차 |
| `carCompactWagon` | 1 | 박스카 왜건 | 🚐 | 1900 | 짐 많이 실리는 든든한 왜건 |
| `carCompactCoupe` | 1 | 미니 쿠페 | 🚕 | 2100 | 아담하지만 스포티하게 |
| `carSedan`(기존) | 2 | 중형 세단 | 🚙 | 6000 | 묵직한 승차감 |
| `carHybrid` | 2 | 하이브리드 세단 | 🔋 | 5800 | 연비 좋은 하이브리드 세단 |
| `carSuv` | 2 | SUV | 🛻 | 6200 | 가족과 함께, 넉넉한 SUV |
| `carImport`(기존) | 3 | 수입차 | 🏎️ | 15000 | 드디어 드림카 |
| `carImportSuv` | 3 | 수입 SUV | 🚙 | 16000 | 수입 SUV, 가족과 함께 하는 럭셔리 |
| `carSupercar` | 3 | 슈퍼카 | 🏁 | 18000 | 레이스가 절로 떠오르는 슈퍼카 |

`types/character.ts`의 `AssetKey` 유니언에 위 6개 신규 키 추가.

### D-2. `shopGacha.ts`는 무수정

`gachaPool(c, "car")`는 이미 `ASSETS.filter(a => a.tier > ownedTier(c.assets, "car"))`로 필터링하고,
`pullShopGacha`는 풀을 가격 오름차순 정렬해 상위 1/3을 "레어" 그룹으로 취급한다.
따라서 아이템 데이터만 늘리면 같은 티어 내에서도 여러 차종이 무작위로 나오고,
초기(티어 0) 상태에서는 상위 티어로 건너뛸 확률도 자연스럽게 유지된다 — 로직 변경 불필요.

### D-3. 필수 버그 수정 — `assetValue`, `canBuyAsset`이 "티어당 1대" 전제

현재 코드:
```ts
// assetValue 내부
const def = ASSETS.find((a) => a.category === cat && a.tier === tier);
// canBuyAsset 내부
const currentDef = ASSETS.find((a) => a.category === def.category && a.tier === current);
```
티어당 아이템이 여러 개가 되면 `.find()`가 배열상 먼저 나오는 아이템을 집어와서,
유저가 실제로 소유한 차종과 무관하게 순자산·차액 계산이 틀어진다(예: `carHybrid`를 소유해도
`carSedan`의 가격으로 계산됨). 아래처럼 "실제 보유 키" 기준으로 찾도록 수정한다:

```ts
/** 카테고리별 보유 중인 자산 중 최고 티어 항목(실제 소유 키 기준) */
function ownedAssetOf(assets: AssetKey[], category: AssetCategory): AssetDef | undefined {
  return ASSETS.filter((a) => a.category === category && assets.includes(a.key)).reduce<
    AssetDef | undefined
  >((best, a) => (!best || a.tier > best.tier ? a : best), undefined);
}
```
- `assetValue`: `ownedAssetOf(assets, cat)?.price ?? 0`을 합산하도록 변경.
- `canBuyAsset`: `currentDef = ownedAssetOf(assets, def.category)`로 교체.
- `ownedTier`는 `ownedAssetOf(...)?.tier ?? 0`으로 재구현(동작은 기존과 동일, 내부 구현만 통일).

### D-4. UI 문구 조정 (`components/room/AssetPanel.tsx`)

현재 `isCurrent = a.tier === current`는 같은 티어의 다른 차종까지 "보유 중"처럼 보이게 만드는 버그를 유발한다.
`isCurrent`는 실제 소유 키(`character.assets.includes(a.key)`) 기준으로 판정하도록 수정.
"매각함" 라벨은 실제로 소유했다가 상위 티어로 교체된 차종에만 표시하고,
"같은 티어의 다른 차종(소유한 적 없음)"은 "미보유(뽑기 확률에서 제외됨)" 계열의 중립적 문구로 구분한다.

---

## E. 데이터/스토어 변경 요약

- `types/character.ts`: `WardrobeItemKey` +16, `RoomItemKey` +14, `AssetKey` +6 (모두 기존 유니언에 추가, 배열 필드 구조 변경 없음)
- persist `version`(현재 19) 증가 없음 — 새 키는 뽑기/구매로 획득되기 전까지 기존 세이브에 없어도 문제 없음
- `lib/game/minigame.ts`: `MinigameKind` +5, 신규 `playX` 함수 5개, `RpsChoice` 타입 신규
- `lib/store/useGameStore.ts`: `playMinigame` 시그니처에 선택적 `extra` 인자 추가
- `lib/game/assets.ts`: `ownedAssetOf` 헬퍼 신규, `assetValue`/`canBuyAsset`/`ownedTier` 내부 구현 수정(외부 시그니처는 동일하게 유지 — 호출부 변경 불필요)

## F. UI 변경 요약

- `components/minigame/MinigamePanel.tsx`: 게임 5종 추가, `rps`/`timing` 전용 인터랙션 추가
- `lib/game/sprite/characterStageConfig.ts`: 신규 의상 8종 스프라이트 매핑
- `components/game/PixelRoom.tsx`: 신규 방 아이템 14종 렌더링 매핑
- `components/room/AssetPanel.tsx`: 소유 판정을 티어 기준 → 키 기준으로 수정

## G. 테스트 계획

기존 테스트 파일 패턴을 그대로 따라 케이스 추가:
- `lib/game/__tests__/minigame.test.ts`: 신규 5개 게임의 경계값(확률 임계값, 행운 보너스 적용) 테스트
- `lib/game/__tests__/shopGacha.test.ts`: 자동차 풀이 9종 기준으로 정상 필터링되는지(티어 필터는 기존 로직 재사용이므로 회귀 확인 위주)
- `lib/game/__tests__/assets.test.ts`(신규 파일): 같은 티어의 다른 차종을 소유했을 때 `assetValue`/`canBuyAsset`이 실제 소유 키 기준으로 정확히 계산되는지(버그 수정 검증의 핵심)
- `lib/game/__tests__/wardrobe.test.ts`, `roomItems.test.ts`: 신규 아이템 개수·가격 오름차순 정렬 등 기존 불변식 유지 확인
