# 방꾸미기 14→28종 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방꾸미기 아이템을 14종에서 28종으로 늘리고, 신규 14종을 `PixelRoom.tsx`에 손그림 CSS 픽셀아트로 실제 배치한다.

**Architecture:** `lib/game/roomItems.ts`의 `ROOM_ITEMS` 카탈로그에 14개 항목을 추가한다(가격 오름차순 불변식 테스트가 있으므로 기존 항목과 병합 정렬된 위치에 삽입 — 이 파일의 테스트는 개수를 하드코딩하지 않아 회귀 위험이 낮다). `components/game/PixelRoom.tsx`의 `OwnedItems` 함수에 `has("key") && (...)` 분기를 14개 추가한다. 이 컴포넌트는 자동화 테스트가 없는 순수 시각 코드라(레포에 `.test.tsx` 파일 자체가 없음), 좌표는 최대한 겹치지 않는 위치로 1차 배치하되 **개발 서버에서 7개 방 테마 전체를 눈으로 확인하며 조정하는 게 이 작업의 핵심 검증 수단**이다.

**Tech Stack:** TypeScript, Vitest, Next.js/React, Tailwind(인라인 스타일 중심)

**참고 스펙:** [docs/superpowers/specs/2026-07-03-play-gacha-expansion-design.md](../specs/2026-07-03-play-gacha-expansion-design.md) 섹션 C

---

### Task 1: `RoomItemKey` 타입에 신규 14종 추가

**Files:**
- Modify: `types/character.ts:61-76`

- [ ] **Step 1: 유니언 확장**

`types/character.ts`에서 아래 블록을 찾는다:

```ts
/** 방 꾸미기 아이템 키 — 뽑기로 획득해 방에 영구 배치 */
export type RoomItemKey =
  | "rug" // 러그
  | "lamp" // 스탠드 조명
  | "bigPlant" // 대형 화분
  | "curtain" // 커튼
  | "fishbowl" // 어항
  | "console" // 게임기(TV)
  | "puppy" // 강아지
  | "robotVacuum" // 로봇청소기
  | "artFrame" // 명화 액자
  | "poster" // 우주 포스터
  | "sofa" // 소파
  | "wallTv" // 벽걸이 TV
  | "catTower" // 캣타워
  | "chandelier"; // 샹들리에
```

다음으로 교체한다:

```ts
/** 방 꾸미기 아이템 키 — 뽑기로 획득해 방에 영구 배치 */
export type RoomItemKey =
  | "rug" // 러그
  | "lamp" // 스탠드 조명
  | "bigPlant" // 대형 화분
  | "curtain" // 커튼
  | "fishbowl" // 어항
  | "console" // 게임기(TV)
  | "puppy" // 강아지
  | "robotVacuum" // 로봇청소기
  | "artFrame" // 명화 액자
  | "poster" // 우주 포스터
  | "sofa" // 소파
  | "wallTv" // 벽걸이 TV
  | "catTower" // 캣타워
  | "chandelier" // 샹들리에
  | "candleSet" // 캔들 세트
  | "succulents" // 다육식물 화분
  | "bookshelf" // 미니 책장
  | "moodLamp" // 무드등
  | "teddyBear" // 곰인형
  | "dartboard" // 다트보드
  | "turntable" // 턴테이블
  | "vanity" // 화장대
  | "miniFridge" // 미니 냉장고
  | "airConditioner" // 에어컨
  | "massageChair" // 안마의자
  | "bigAquarium" // 대형 수족관
  | "homeTheater" // 홈시어터
  | "grandPiano"; // 그랜드 피아노
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add types/character.ts
git commit -m "feat: RoomItemKey에 신규 14종 추가"
```

---

### Task 2: `ROOM_ITEMS` 카탈로그에 신규 14종 추가

**Files:**
- Modify: `lib/game/roomItems.ts:19-34`
- Test: `lib/game/__tests__/roomItems.test.ts` (수정 없이 그대로 통과해야 함 — 개수를 하드코딩하지 않는 일반 불변식 테스트라 회귀 위험이 낮다)

- [ ] **Step 1: `ROOM_ITEMS` 배열 전체 교체**

`lib/game/roomItems.ts`에서 아래 블록을 찾는다:

```ts
/** 가격 오름차순 — 상점 목록 순서 그대로 사용 */
export const ROOM_ITEMS: RoomItemDef[] = [
  { key: "rug", label: "러그", emoji: "🟫", price: 50, desc: "방 한가운데 포근한 러그" },
  { key: "poster", label: "우주 포스터", emoji: "🪐", price: 60, desc: "벽에 붙인 낭만 한 장" },
  { key: "lamp", label: "스탠드 조명", emoji: "💡", price: 80, desc: "아늑한 코너 조명" },
  { key: "bigPlant", label: "대형 화분", emoji: "🪴", price: 100, desc: "침대 옆 초록 식물" },
  { key: "curtain", label: "커튼", emoji: "🪟", price: 120, desc: "창문 양옆 커튼" },
  { key: "fishbowl", label: "어항", emoji: "🐟", price: 150, desc: "물고기 한 마리" },
  { key: "console", label: "게임기", emoji: "🎮", price: 200, desc: "작은 TV + 게임기" },
  { key: "sofa", label: "소파", emoji: "🛋️", price: 300, desc: "푹 꺼지는 1인용 소파" },
  { key: "wallTv", label: "벽걸이 TV", emoji: "📺", price: 400, desc: "벽에 딱 붙는 대화면" },
  { key: "puppy", label: "강아지", emoji: "🐶", price: 500, desc: "꼬리 흔드는 가족" },
  { key: "catTower", label: "캣타워", emoji: "🐈", price: 600, desc: "고양이 전용 전망대" },
  { key: "robotVacuum", label: "로봇청소기", emoji: "🤖", price: 800, desc: "알아서 청소해줘요" },
  { key: "chandelier", label: "샹들리에", emoji: "✨", price: 1000, desc: "천장에서 쏟아지는 럭셔리" },
  { key: "artFrame", label: "명화 액자", emoji: "🖼️", price: 1200, desc: "거장의 작품(느낌)" },
];
```

다음으로 교체한다(가격 오름차순으로 신규 항목을 병합):

```ts
/** 가격 오름차순 — 상점 목록 순서 그대로 사용 */
export const ROOM_ITEMS: RoomItemDef[] = [
  { key: "candleSet", label: "캔들 세트", emoji: "🕯️", price: 40, desc: "은은한 향과 조명" },
  { key: "rug", label: "러그", emoji: "🟫", price: 50, desc: "방 한가운데 포근한 러그" },
  { key: "poster", label: "우주 포스터", emoji: "🪐", price: 60, desc: "벽에 붙인 낭만 한 장" },
  { key: "succulents", label: "다육식물 화분", emoji: "🌵", price: 70, desc: "손 안 가는 초록이" },
  { key: "lamp", label: "스탠드 조명", emoji: "💡", price: 80, desc: "아늑한 코너 조명" },
  { key: "bookshelf", label: "미니 책장", emoji: "📚", price: 90, desc: "책 좀 읽는 사람 컨셉" },
  { key: "bigPlant", label: "대형 화분", emoji: "🪴", price: 100, desc: "침대 옆 초록 식물" },
  { key: "moodLamp", label: "무드등", emoji: "🌙", price: 110, desc: "밤엔 은은하게" },
  { key: "curtain", label: "커튼", emoji: "🪟", price: 120, desc: "창문 양옆 커튼" },
  { key: "teddyBear", label: "곰인형", emoji: "🧸", price: 130, desc: "포근한 방 친구" },
  { key: "fishbowl", label: "어항", emoji: "🐟", price: 150, desc: "물고기 한 마리" },
  { key: "dartboard", label: "다트보드", emoji: "🎯", price: 160, desc: "벽에 거는 승부욕" },
  { key: "console", label: "게임기", emoji: "🎮", price: 200, desc: "작은 TV + 게임기" },
  { key: "turntable", label: "턴테이블", emoji: "📻", price: 250, desc: "아날로그 감성 가득" },
  { key: "vanity", label: "화장대", emoji: "🪞", price: 260, desc: "거울 앞에서 꾸미는 시간" },
  { key: "sofa", label: "소파", emoji: "🛋️", price: 300, desc: "푹 꺼지는 1인용 소파" },
  { key: "miniFridge", label: "미니 냉장고", emoji: "🧊", price: 350, desc: "방에서 시원한 음료 한 잔" },
  { key: "wallTv", label: "벽걸이 TV", emoji: "📺", price: 400, desc: "벽에 딱 붙는 대화면" },
  { key: "airConditioner", label: "에어컨", emoji: "🌬️", price: 450, desc: "여름 나기의 필수템" },
  { key: "puppy", label: "강아지", emoji: "🐶", price: 500, desc: "꼬리 흔드는 가족" },
  { key: "catTower", label: "캣타워", emoji: "🐈", price: 600, desc: "고양이 전용 전망대" },
  { key: "massageChair", label: "안마의자", emoji: "💺", price: 700, desc: "퇴근 후 완벽한 휴식" },
  { key: "robotVacuum", label: "로봇청소기", emoji: "🤖", price: 800, desc: "알아서 청소해줘요" },
  { key: "bigAquarium", label: "대형 수족관", emoji: "🐠", price: 900, desc: "물고기 여러 마리가 사는 방" },
  { key: "chandelier", label: "샹들리에", emoji: "✨", price: 1000, desc: "천장에서 쏟아지는 럭셔리" },
  { key: "homeTheater", label: "홈시어터", emoji: "🎬", price: 1100, desc: "극장이 부럽지 않은 사운드" },
  { key: "artFrame", label: "명화 액자", emoji: "🖼️", price: 1200, desc: "거장의 작품(느낌)" },
  { key: "grandPiano", label: "그랜드 피아노", emoji: "🎹", price: 1400, desc: "방 안의 콘서트홀" },
];
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 기존 테스트 실행 — 통과 확인(회귀 없음)**

Run: `npm test -- roomItems.test`
Expected: PASS — 이 테스트 파일은 개수를 하드코딩하지 않고 "가격 오름차순", "key 유일", "puppy=500원" 같은 일반 불변식만 확인하므로 28종으로 늘어나도 그대로 통과한다.

Run: `npm test -- shopGacha.test`
Expected: PASS — `shopGacha.test.ts`의 "레어 판정" 테스트는 `pool.slice(-3)`으로 최고가 아이템 포함 여부만 확인하고, `rand2=0.99`는 항상 그룹 내 최고가 아이템을 선택하므로 풀 크기가 늘어나도 깨지지 않는다. (자동차 플랜에서 추가한 "마지막 남은 아이템" 테스트도 `ROOM_ITEMS.filter(i => i.key !== "artFrame")`로 동적으로 작성돼 있어 28종이 되어도 그대로 유효하다.)

- [ ] **Step 4: Commit**

```bash
git add lib/game/roomItems.ts
git commit -m "feat: 방꾸미기 카탈로그를 28종으로 확장"
```

---

### Task 3: `PixelRoom.tsx`에 신규 14종 픽셀아트 배치

**Files:**
- Modify: `components/game/PixelRoom.tsx`

이 컴포넌트는 자동화 테스트가 없다(레포 전체에 `.test.tsx` 파일 없음). 아래 좌표는 기존 14종 및 단계별 가구(`FurnSet`/`WallDecor`)와 최대한 안 겹치도록 1차로 잡은 값이며, **Task 4의 시각 확인에서 실제로 조정하는 것을 전제로 한다.**

- [ ] **Step 1: `OwnedItems` 함수 끝에 신규 14개 블록 추가**

`components/game/PixelRoom.tsx`에서 `OwnedItems` 함수의 `chandelier` 블록(마지막 기존 아이템) 바로 다음, 함수를 닫는 `</>\n  );\n}` 앞에 아래 14개 블록을 추가한다. 즉 아래 블록을 찾는다:

```tsx
      {has("chandelier") && (
        <div className="absolute" style={{ left: "44%", top: "0%", width: "12%", height: "8%", zIndex: 0 }}>
          {/* 천장 스템 + 가로 암 + 전구 3개 */}
          <span className="absolute left-1/2 top-0 w-[2px] -translate-x-1/2" style={{ height: "42%", background: ink }} />
          <span className="absolute" style={{ left: "8%", top: "42%", width: "84%", height: 2, background: ink }} />
          {["6%", "44%", "82%"].map((l) => (
            <span
              key={l}
              className="absolute"
              style={{ left: l, top: "52%", width: "14%", height: "38%", background: propHi, border: `2px solid ${ink}`, borderRadius: "0 0 50% 50%" }}
            />
          ))}
        </div>
      )}
    </>
  );
}
```

다음으로 교체한다:

```tsx
      {has("chandelier") && (
        <div className="absolute" style={{ left: "44%", top: "0%", width: "12%", height: "8%", zIndex: 0 }}>
          {/* 천장 스템 + 가로 암 + 전구 3개 */}
          <span className="absolute left-1/2 top-0 w-[2px] -translate-x-1/2" style={{ height: "42%", background: ink }} />
          <span className="absolute" style={{ left: "8%", top: "42%", width: "84%", height: 2, background: ink }} />
          {["6%", "44%", "82%"].map((l) => (
            <span
              key={l}
              className="absolute"
              style={{ left: l, top: "52%", width: "14%", height: "38%", background: propHi, border: `2px solid ${ink}`, borderRadius: "0 0 50% 50%" }}
            />
          ))}
        </div>
      )}
      {has("candleSet") && (
        <div className="absolute" style={{ left: "76%", top: "3%", width: "10%", height: "5%", zIndex: 0 }}>
          <span className="absolute" style={{ left: "10%", bottom: 0, width: "18%", height: "80%", background: propHi, border: `2px solid ${ink}` }} />
          <span className="absolute" style={{ left: "55%", bottom: 0, width: "18%", height: "60%", background: propHi, border: `2px solid ${ink}` }} />
        </div>
      )}
      {has("succulents") && (
        <div className="absolute" style={{ left: "40%", top: "10%", width: "6%", height: "7%", zIndex: 1 }}>
          <span className="absolute inset-x-0 bottom-0" style={{ height: "45%", background: prop, border: `2px solid ${ink}` }} />
          <span className="absolute" style={{ left: "10%", right: "10%", bottom: "40%", height: "60%", background: propHi, borderRadius: "50% 50% 20% 20%" }} />
        </div>
      )}
      {has("bookshelf") && (
        <div className="absolute" style={{ left: "1%", top: "24%", width: "10%", height: "18%", background: propHi, border: `2px solid ${ink}`, zIndex: 0 }}>
          {[65, 30].map((b) => (
            <span key={b} className="absolute" style={{ left: 0, right: 0, bottom: `${b}%`, height: 2, background: ink }} />
          ))}
        </div>
      )}
      {has("moodLamp") && (
        <div className="absolute" style={{ left: "82%", top: "10%", width: "6%", height: "14%", zIndex: 1 }}>
          <span className="absolute left-1/2 bottom-0 w-[2px] -translate-x-1/2" style={{ height: "70%", background: ink }} />
          <span className="absolute inset-x-0 top-0" style={{ height: "35%", background: propHi, border: `2px solid ${ink}`, borderRadius: "50%" }} />
        </div>
      )}
      {has("teddyBear") && (
        <div className="absolute" style={{ left: "6%", bottom: "20%", width: "9%", height: "10%", zIndex: 2 }} aria-label="곰인형">
          <span className="absolute" style={{ left: "10%", bottom: 0, width: "80%", height: "62%", background: prop, border: `2px solid ${ink}`, borderRadius: "30%" }} />
          <span className="absolute" style={{ left: "18%", top: 0, width: "64%", height: "44%", background: prop, border: `2px solid ${ink}`, borderRadius: "50%" }} />
          <span className="absolute" style={{ left: "6%", top: "-6%", width: "20%", height: "20%", background: prop, borderRadius: "50%" }} />
          <span className="absolute" style={{ right: "6%", top: "-6%", width: "20%", height: "20%", background: prop, borderRadius: "50%" }} />
        </div>
      )}
      {has("dartboard") && (
        <div className="absolute" style={{ left: "91%", top: "26%", width: "7%", height: "10%", background: propHi, border: `2px solid ${ink}`, borderRadius: "50%", zIndex: 1 }}>
          <span className="absolute inset-[28%] rounded-full" style={{ background: ink }} />
        </div>
      )}
      {has("turntable") && (
        <div className="absolute" style={{ left: "1%", top: "18%", width: "10%", height: "5%", background: prop, border: `2px solid ${ink}`, zIndex: 1 }}>
          <span className="absolute" style={{ left: "60%", top: "15%", width: "30%", height: "70%", background: ink, borderRadius: "50%" }} />
        </div>
      )}
      {has("vanity") && (
        <div className="absolute" style={{ left: "1%", bottom: "6%", width: "9%", height: "13%", zIndex: 1 }}>
          <span className="absolute inset-x-0 bottom-0" style={{ height: "55%", background: prop, border: `2px solid ${ink}` }} />
          <span className="absolute" style={{ left: "20%", right: "20%", bottom: "50%", height: "50%", background: propHi, border: `2px solid ${ink}`, borderRadius: "50% 50% 0 0" }} />
        </div>
      )}
      {has("miniFridge") && (
        <div className="absolute" style={{ left: "52%", bottom: "6%", width: "8%", height: "16%", background: propHi, border: `2px solid ${ink}`, zIndex: 1 }}>
          <span className="absolute inset-x-0" style={{ top: "34%", height: 2, background: ink }} />
        </div>
      )}
      {has("airConditioner") && (
        <div className="absolute" style={{ left: "60%", top: "2%", width: "14%", height: "7%", background: propHi, border: `2px solid ${ink}`, zIndex: 0 }}>
          <span className="absolute" style={{ left: "10%", right: "10%", bottom: "15%", height: "20%", background: ink }} />
        </div>
      )}
      {has("massageChair") && (
        <div className="absolute" style={{ left: "24%", bottom: "6%", width: "11%", height: "15%", zIndex: 1 }}>
          <span className="absolute inset-x-0 bottom-0" style={{ height: "60%", background: prop, border: `2px solid ${ink}` }} />
          <span className="absolute inset-x-0 top-0" style={{ height: "50%", background: propHi, border: `2px solid ${ink}` }} />
        </div>
      )}
      {has("bigAquarium") && (
        <div className="absolute" style={{ left: "14%", top: "24%", width: "14%", height: "12%", background: propHi, border: `2px solid ${ink}`, zIndex: 1 }}>
          <span className="absolute" style={{ left: "30%", top: "35%", width: "16%", height: "20%", background: ink, borderRadius: "50%" }} />
          <span className="absolute" style={{ left: "58%", top: "50%", width: "12%", height: "16%", background: ink, borderRadius: "50%" }} />
        </div>
      )}
      {has("homeTheater") && (
        <div className="absolute" style={{ left: "68%", top: "48%", width: "15%", height: "5%", background: ink, zIndex: 0 }}>
          <span className="absolute inset-[18%]" style={{ background: propHi }} />
        </div>
      )}
      {has("grandPiano") && (
        <div className="absolute" style={{ left: "36%", bottom: "6%", width: "18%", height: "13%", zIndex: 1 }} aria-label="그랜드 피아노">
          <span className="absolute inset-x-0 bottom-0" style={{ height: "60%", background: ink, border: `2px solid ${ink}` }} />
          <span
            className="absolute"
            style={{ left: 0, bottom: "55%", width: "70%", height: "45%", background: ink, border: `2px solid ${ink}`, clipPath: "polygon(0 100%, 100% 100%, 40% 0, 0 0)" }}
          />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add components/game/PixelRoom.tsx
git commit -m "feat: 방꾸미기 신규 14종 픽셀아트 1차 배치"
```

---

### Task 4: 개발 서버로 시각 확인 + 좌표 조정 (이 플랜의 핵심 검증)

**Files:**
- Modify: `components/game/PixelRoom.tsx` (조정 필요 시)

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev`

- [ ] **Step 2: 아이템 미리보기용 임시 캐릭터로 확인**

`/character-preview` 페이지(이미 존재하는 스프라이트 미리보기 라우트)나 `/dashboard`에서 방꾸미기 상점(`RoomShopPanel`)으로 28종을 모두 구매(또는 뽑기)한 테스트 캐릭터를 만든다. 저축을 넉넉히 올려두고 방꾸미기 뽑기(`GachaPullButton`, category="room")를 반복 실행하거나, 브라우저 콘솔에서 캐릭터 상태를 직접 조작해 `roomItems`에 28개 키를 전부 채운다.

- [ ] **Step 3: 7개 방 테마에서 전부 확인**

캐릭터 나이를 바꿔가며(또는 `PixelRoom`을 사용하는 미리보기에서 `stage`를 바꿔가며) 아래 7개 테마 각각에서 방을 스크린샷/육안 확인한다:
`nursery`(아기) · `kidRoom`(유아) · `studyRoom`(중고생) · `campus`(대학생) · `jobseekerRoom`(취준생) · `office`(직장인) · `seniorOffice`(경력직)

각 테마에서 확인할 것:
1. 28개 아이템을 모두 켰을 때 서로 완전히 겹쳐서 안 보이는 아이템이 없는지 (부분 겹침은 기존 14종도 감안하고 있어 허용되지만, 완전히 가려지는 건 안 됨)
2. 신규 아이템이 `WallDecor`/`FurnSet`(테마·직업별 가구)와 완전히 겹치지 않는지
3. 밤 모드(`night=true`, 어두운 팔레트)에서도 아이템이 잘 보이는지

- [ ] **Step 4: 겹침 발견 시 좌표 조정**

문제가 있는 아이템은 `components/game/PixelRoom.tsx`의 해당 `has("key") && (...)` 블록에서 `left`/`top`/`bottom`/`width`/`height` 값만 조정한다(구조는 유지). 조정할 때마다 다시 확인한다.

- [ ] **Step 5: 조정 사항 Commit (조정이 있었던 경우만)**

```bash
git add components/game/PixelRoom.tsx
git commit -m "fix: 방꾸미기 신규 아이템 좌표를 시각 확인 후 조정"
```

- [ ] **Step 6: 서버 종료**

확인 후 개발 서버를 중지한다.

---

### Task 5: 최종 검증

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
