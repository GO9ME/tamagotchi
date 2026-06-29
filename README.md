# 🐣 LifeGotchi

한국형 **인생 · 커리어 다마고치** 웹앱. 아기 캐릭터를 만들어 밥 · 공부 · 운동 · 자기개발을
주기적으로 직접 눌러 키우고, 나중에는 취업 → 업무평가 → 연봉협상 → 승진까지 경험합니다.

> 단순 방치형이 아닙니다. **페이지를 켜두고 정해진 주기마다 직접 액션을 눌러야** 성장해요.

현재 단계: **Phase 1 + Phase 2** 완료. 취업/연봉/승진/랭킹은 이후 단계에서 추가됩니다.

비주얼은 **2D 픽셀 다마고치** 감성입니다. 본문은 **Pretendard**, 제목·라벨·숫자는 한국어 픽셀
폰트 **Galmuri**를 쓰고, 캐릭터는 LCD 화면 속 픽셀 마스코트 + 손안의 기기(LCD) 프레임으로
표현됩니다. 이모지는 8×8 픽셀 아이콘으로 대체했습니다.

---

## ✨ 구현된 기능 (Phase 1)

- 아기 캐릭터 생성 (이름 · 모습)
- 컨디션 수치: 배고픔/체력/기분/건강/집중력/청결/수면질/자신감/스트레스/번아웃
- **시간 경과 감소** — 켜두지 않으면 배고픔·체력·집중력이 떨어집니다
- **밥 먹이기** — 집밥/급식/편의점/패스트푸드/샐러드/커피, 음식별 효과와 몸무게 변화, 과식 페널티
- **공부하기 30분 세션** — 시작 → 30분 후 완료 버튼 활성화 → 완료 시 보상
  - 10분 안 완료 100% / 30분 안 70% / 그 후 30% / 자리 비움 시 집중 실패
  - 배고픔·체력·기분이 낮으면 보상 효율 감소, 집중력 높으면 보너스
- **운동/자기개발/독서/놀이/낮잠/수면/씻기/간식** — 쿨타임 기반 즉시 액션
- **몸무게 관리** — 과식·미운동 시 증가, 운동 시 감소, 적정 범위 벗어나면 페널티
- 성장 스탯(지능·성실성·창의력·체력단련·소통·커리어 등) + 레벨/경험치
- 나이·성장 단계 표시 (현실 1일 = 게임 1년, 조절 가능)
- **새로고침해도 유지** — 브라우저 localStorage 에 익명 저장
- 반응형 UI (모바일/데스크톱)

---

## 🔐 데이터 / 개인정보 정책

- 회원가입 없음. 실명·전화번호·실제 회사/연봉 등 **개인정보를 일절 수집하지 않습니다.**
- 브라우저별 익명 ID(`guest_xxxx`)만 사용하며, 게임 진행 데이터만 저장합니다.
- Phase 1 은 **localStorage** 에 저장됩니다. (같은 브라우저에서 이어하기 가능)
- 저장 레이어는 `lib/storage/` 에 추상화되어 있어, 이후 **Supabase Anonymous Auth + RLS**
  로 교체할 수 있습니다. (`lib/storage/local.ts` 의 TODO 참고)

---

## 🚀 실행 방법

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버
npm run dev
# http://localhost:3000

# 3) 프로덕션 빌드 / 실행
npm run build
npm run start
```

Node 18.18+ (권장 20+) 가 필요합니다.

---

## ⚙️ 환경변수

`.env.example` 를 `.env.local` 로 복사해서 사용하세요. **Phase 1 은 환경변수 없이도 동작합니다.**

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `NEXT_PUBLIC_GAME_YEAR_MS` | 게임 1년 = 현실 몇 ms (테스트 시 줄이면 나이가 빨리 듦) | `86400000` (1일) |

> 예: 개발 중 빠르게 나이 변화를 보려면 `.env.local` 에 `NEXT_PUBLIC_GAME_YEAR_MS=600000` (10분).

`Supabase` 관련 변수는 Phase 3+ 에서 추가됩니다(현재 주석 처리).

---

## 🧱 프로젝트 구조

```
app/
  page.tsx            # 랜딩
  create/page.tsx     # 캐릭터 생성
  dashboard/page.tsx  # 메인 대시보드(게임 루프)
components/
  character/          # 아바타 · 컨디션 · 스탯 · 몸무게 카드
  actions/            # 공부 세션 · 음식 선택 · 액션 그리드 · 쿨타임 버튼
  common/             # StatBar · Toast · CTA · StoreHydrator
lib/
  game/               # ★ 모든 게임 공식 (순수 함수)
    constants.ts      #   시간/감소율/음식/단계/적정몸무게/레벨곡선
    clamp.ts          #   값 범위 제한
    status.ts         #   시간 경과 감소 · 학습 효율
    weight.ts         #   몸무게 판정 · 페널티
    actions.ts        #   액션 정의 + 효과
    study.ts          #   공부 세션 보상(시간 구간/효율)
    growth.ts         #   나이 → 성장 단계
    engine.ts         #   효과 적용 · 레벨업 · 쿨타임
    character.ts      #   캐릭터 생성 · 경험치 진행
  store/useGameStore.ts  # zustand 상태 + localStorage persist
  storage/local.ts    # 익명 userId (Supabase 교체 지점)
  hooks/useNow.ts     # 타이머용 현재시각 훅
types/                # 데이터 타입 정의
```

게임 규칙은 모두 `lib/game` 에 모여 있어, 추후 서버(Route Handler/Supabase Edge)에서
**그대로 재사용**할 수 있습니다.

---

## ☁️ Vercel 배포

1. 이 저장소를 GitHub 에 push (이미 `origin` 이 연결돼 있습니다).
2. [vercel.com](https://vercel.com) → New Project → 이 저장소 import.
3. 프레임워크 자동 감지(Next.js). 빌드 설정 그대로 두면 됩니다.
4. (선택) Environment Variables 에 `NEXT_PUBLIC_GAME_YEAR_MS` 추가.
5. Deploy.

별도 백엔드/DB 없이 정적+서버리스로 바로 배포됩니다.

---

## 🗺️ 로드맵 (다음 단계)

- ~~**Phase 2**~~ ✅ — 나이 증가 시 **연간 리뷰**, 전년도 자기개발 부족 페널티, 단계별 액션 잠금, 학업 스탯/시험, 성장기록 화면, 모바일 하단 네비 + PWA(홈 화면 추가)
- **Phase 3** — 취업 시스템(직업군 선택, 취업 준비 점수, 초봉)
- **Phase 4** — 회사 생활(업무 액션, 직무 스탯, 업무평가, 승진)
- **Phase 5** — 연봉협상, 랭킹(종합/연봉/직무/건강/자기개발)
- **인프라** — Supabase Anonymous Auth + RLS 로 서버 권위 계산 전환

### TODO (MVP 범위 밖, 미구현)

친구 방문 · 채팅 · 결제 · 아이템 상점 · AI 대화 · 실시간 PvP · 정식 회원가입/소셜 로그인.

---

Made with Next.js · TypeScript · Tailwind CSS · Zustand
