# 픽셀 사람 캐릭터 가이드 (PIXEL_CHARACTER_GUIDE)

LifeGotchi 의 사람형 픽셀 캐릭터 시스템 설명서. MVP 는 외부 이미지 없이 CSS(div 그리드)로 도트 캐릭터를 그리며, 추후 PNG 스프라이트 시트로 교체 가능한 구조다.

---

## 1. 캐릭터 스타일 방향

- 2D 픽셀 아트, **사람형** 도트 캐릭터 (아기 → 직장인까지 성장).
- 귀엽지만 유아스럽지 않게, 고전 다마고치 **감성만** 참고(원작 리소스·외형 모방 금지).
- **단색 LCD 잉크** 방향(사용자 선택): 컬러 휴가 아니라 4단계 명도 램프
  `ink → shade → fill → glint` 로 피부·머리·옷·소품을 구분. 게임보이/LCD 감성.
- 같은 화면(픽셀 방)과 톤을 공유해 통일감 유지.

피하는 것: 원작 Tamagotchi 외형/스프라이트/게임기 UI, 저작권 불명 이미지,
타 IP 유사 캐릭터, 과한 일러스트/3D, 웹앱과 안 어울리는 고해상도 이미지.

---

## 2. 성장 단계별 모습

`lib/game/sprite/characterStageConfig.ts` 의 `STAGE_CONFIG` 가 단계별 외형(체형 tier,
머리, 옷, 방 테마, 소품)을 정의한다. 앱의 `LifeStage` 를 그대로 사용한다.

| LifeStage | tier | 머리 | 옷(요지) | 방 | 소품 |
|---|---|---|---|---|---|
| baby | tiny | 한 줌 | 우주복+기저귀 | nursery | 장난감 |
| child | small | 짧은 | 기본 티 | kidRoom | 장난감 |
| elementary | small | 짧은 | 티 + 책가방 끈 | kidRoom | 가방 |
| middle | mid | 단발 | 교복 깃 | studyRoom | — |
| high | mid | 단발 | 교복 + 넥타이 | studyRoom | — |
| university | mid | 단발 | 후드티 | studyRoom | — |
| jobseeker | mid | 단정 | 블레이저 + 셔츠 | jobseekerRoom | 파일 |
| employee | full | 단정 | 셔츠+넥타이+사원증 | office | 사원증 |
| senior | full | 희끗 | 정장 풀세트 | seniorOffice | 서류 |
| retirement | full | 희끗 | 정장 재킷 | seniorOffice | — |

- **체형 tier**(tiny/small/mid/full)가 머리 비율·다리 길이를 바꿔 나이대를 표현
  (어릴수록 머리가 상대적으로 크고 통통).
- **직업군 악센트**: `jobType`(tech/creative/physical/expert/office)으로 직장인·경력직
  복장을 미세 조정(예: tech = 후드 + 넥타이 제거).

> 스펙의 `middle_school/high_school/job_seeker/senior_employee` 는 앱 내부에서
> `middle/high/jobseeker/senior` 로 부른다(같은 단계).

---

## 3. 상태별 표정/포즈

상태 해석은 `lib/game/sprite/characterVisualState.ts` 의 `getCharacterVisualState()`
순수 함수가 담당한다(표시 10종: normal/happy/tired/hungry/sick/studying/working/
burned_out/sleeping/exercising).

해석 규칙(우선순위):
1. **명시적 액션**(sleeping/working/studying/exercising)이 있으면 포즈·소품 결정.
   심각한 컨디션(아픔·번아웃)은 표정·오버레이로 덧씌움.
2. 액션이 없으면 컨디션: `sick > burned_out > hungry > tired > happy > normal`.

| 조건 | 표현 |
|---|---|
| hunger < 30 | 힘없는 표정·벌린 입·머리 위 말풍선·고개 숙임 애니메이션 |
| energy < 30 | 감은(졸린) 눈·Z 표시·앉은 포즈·느린 흔들림 |
| mood > 70 | 웃는 표정·반짝임·살짝 통통 튀는 애니메이션 |
| health < 30 | 아픈 표정·창백한 팔레트(pale)·땀·볼 밴드 |
| burnout > 70 | 다크무드(먹구름)·구부정/정지에 가까운 애니메이션 |
| studying | 앉은 포즈 + 노트/연필 소품 + 책 보는 작은 움직임 |
| working | 앉은 포즈 + 노트북 소품 + 타이핑 느낌(번아웃이면 정지) |
| sleeping | 누운 포즈 + 이불/베개 + Z + 어두운 방(night) |
| exercising | 다리 벌린 스탠스 + 땀 + 점프 idle |

`VisualState` 는 `{ state, expression, pose, overlays, prop, anim, tone, label }` 을 담아
렌더러에 넘긴다.

---

## 4. CSS 기반 MVP 구현 방식

- 캐릭터는 16×20 코드 매트릭스로 조립된다. 부품(머리/머리카락/몸통/팔/다리/소품/
  오버레이)을 순서대로 스탬핑하므로 단계×상태 조합을 일일이 그리지 않는다.
  (`buildCharacterMatrix()` → `matrixToCells()`)
- 렌더링은 **div 그리드**(CSS Grid): 셀마다 단색 `<span>`. 코드(K/S/F/W)는
  `characterPalettes.ts` 의 명도 램프로 색을 입힌다. 외부 이미지 0개.
- 애니메이션은 래퍼 클래스(`.pxc-*`, `app/globals.css`)로만: 1~2px 위아래 idle,
  상태별 가벼운 움직임. **`prefers-reduced-motion: reduce` 대응**(애니메이션 off).
- 캐릭터는 단독으로 두지 않고 **PixelRoom** 안에 배치(바닥/벽/창문/침대/책상/
  책장·화분 + 단계 소품). 방도 같은 LCD 톤을 공유한다.

### 컴포넌트 구조

```
components/game/
  PixelCharacter.tsx        # 진입점: 상태 해석 → 하위 렌더러 선택
  CSSPixelCharacter.tsx     # MVP 렌더러(div 그리드)
  SpriteSheetCharacter.tsx  # 추후 PNG 시트 렌더러(스텁, 시트 없으면 CSS 폴백)
  PixelRoom.tsx             # 픽셀 방 배경 + 캐릭터 배치
  CharacterSpeechBubble.tsx # 머리 위 말풍선
  CharacterStatusIcon.tsx   # 상태 칩(8×8 PixelIcon 재사용)

lib/game/sprite/
  characterVisualState.ts   # 상태 해석(getCharacterVisualState) + 타입
  characterPalettes.ts      # 단색 LCD 명도 램프(+ pale/방/밤 팔레트)
  characterStageConfig.ts   # 단계 설정 + 픽셀 조립 빌더
```

호출 예:

```tsx
<PixelRoom stage={stage} night={sleeping}>
  <PixelCharacter
    lifeStage={stage}
    mood={mood} hunger={hunger} energy={energy} health={health} burnout={burnout}
    actionState={actionState} jobType={jobType} gender={gender}
  />
</PixelRoom>
```

미리보기 갤러리: `/character-preview` (모든 단계 × 상태 매트릭스).

---

## 5. 추후 스프라이트 시트 교체 계획

- `PixelCharacter` 는 CSS 를 직접 들지 않고 **VisualState 를 하위 렌더러에 위임**한다.
  렌더 방식이 바뀌어도 상태 해석/호출부는 그대로다.
- 교체 절차:
  1. CC0/직접 제작 PNG 스프라이트 시트를 `public/sprites/` 에 둔다(라이선스 확인 필수).
  2. `SpriteSheetConfig`(src/frame 크기/`rowFor`(state)/`colFor`(stage))를 작성.
  3. `<PixelCharacter renderer="sprite" sheet={...} />` 로 전환. 시트가 없으면 자동으로
     CSS 렌더러로 폴백하므로 점진적 교체가 가능하다.
- 상태→프레임 매핑은 `VisualState.state`(10종)와 `lifeStage` 기준으로 잡으면 된다.

---

## 6. 외부 에셋 사용 시 라이선스 확인 규칙

- MVP 는 **외부 이미지 에셋 0개**(전부 CSS/코드 생성).
- 외부 에셋을 도입할 땐 반드시 `docs/ASSET_LICENSES.md` 의 체크리스트를 거치고
  출처·라이선스·사용 범위를 기록한 뒤 사용한다.
- 원작 Tamagotchi 의 스프라이트/사운드/게임기 UI 및 타 IP 유사 리소스는 사용 금지.
