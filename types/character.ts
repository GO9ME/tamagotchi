// 게임 내 데이터 타입 정의. 실제 개인정보는 저장하지 않는다.

export type LifeStage =
  | "baby"
  | "child"
  | "elementary"
  | "middle"
  | "high"
  | "university"
  | "jobseeker"
  | "employee"
  | "senior"
  | "retirement";

/** 0~100 으로 관리하는 상태 수치 (weight 는 예외로 kg) */
export interface CharacterStatus {
  hunger: number;
  energy: number;
  mood: number;
  health: number;
  stress: number;
  focus: number;
  sleepQuality: number;
  cleanliness: number;
  confidence: number;
  burnout: number;
  weight: number; // kg
}

/** 누적 성장 스탯 (소수 가능, 표시할 때 반올림) */
export interface CharacterStats {
  intelligence: number;
  discipline: number;
  creativity: number;
  memory: number;
  fitness: number;
  stamina: number; // 지구력(유산소 운동으로 성장)
  strength: number; // 근력(웨이트 트레이닝으로 성장)
  communication: number;
  careerPotential: number;
  employability: number;
  academic: number; // 학업 누적 (시험/진학·취업 준비)
  portfolioScore: number; // 취업 준비: 포트폴리오
  interviewScore: number; // 취업 준비: 면접
  certificateScore: number; // 취업 준비: 자격증
  performance: number; // 업무 성과(직장인) 누적
}

/** 캐릭터 성별 (게임 내 가상 속성 — 신장 분포·외형에만 영향) */
export type Gender = "male" | "female";

/** 최종 학위 — 높을수록 취업률·초봉 보너스(대신 대학원은 시간·등록금·스트레스 비용) */
export type Degree = "highschool" | "bachelor" | "master" | "phd";

/** 현재 대학원 재학 상태 (석/박사 과정) */
export interface GradEnroll {
  degree: "master" | "phd";
  startAge: number; // 입학 게임나이
}

/** 학부(대학교) 티어 — 등록금·학업 커트라인·취업 보너스가 다름 */
export type UniversityTierKey = "elite" | "national" | "mid" | "local";

/** 선택한 대학 + 학자금대출 상태 */
export interface UniversityChoice {
  tier: UniversityTierKey;
  enrolledAtAge: number; // 입학 게임나이
  loanBalance: number; // 학자금대출 잔액(만원). 0이면 없음/완납
}

// --- 취업(Phase 3) ---
export type JobFamilyKey =
  | "management"
  | "finance"
  | "hr"
  | "sales"
  | "marketing"
  | "dev"
  | "data"
  | "pm"
  | "design"
  | "cs"
  | "production"
  | "legal"
  | "medical" // 전문직(의료)
  | "research" // 연구직
  | "civil" // 공무원
  | "athlete"; // 스포츠/운동선수 (키 어드밴티지)

export type CompanyTypeKey =
  | "large"
  | "midsize"
  | "small"
  | "startup"
  | "public"
  | "freelance";

export type JobGrade =
  | "intern"
  | "newbie"
  | "staff"
  | "junior" // 주임
  | "assistant" // 대리
  | "manager" // 과장
  | "deputy" // 차장
  | "director" // 부장
  | "executive" // 임원
  | "ceo"; // 대표

export interface JobState {
  family: JobFamilyKey;
  company: CompanyTypeKey;
  grade: JobGrade;
  title: string;
  salaryManwon: number; // 만원 단위
  hiredAt: number; // epoch ms
  hiredAtAge: number;
  lastEvalGrade?: ReviewGrade; // 최근 업무평가 등급
  lastRaisePct?: number; // 직전 인상률(%)
  promotedAtAge?: number;
  lastNegotiatedAtAge?: number; // 마지막 연봉협상 게임나이(연 1회 게이트)
  lastNegotiatePct?: number; // 직전 협상 인상률(%) — 자동인상과 구분 표시
}

/** 연봉협상 결과 (비영속 모달용) */
export interface NegotiationResult {
  outcome: "success" | "fail" | "backfire";
  salaryBefore: number;
  salaryAfter: number;
  raisePct: number;
  leverage: number; // 0~1
  successP: number; // 0~1
  atAge: number;
}

/** 직장인 연간 업무평가 기록 (YearlyReview.work 에 첨부) */
export interface WorkReview {
  evalScore: number;
  grade: ReviewGrade;
  workPerformance: number;
  raisePct: number;
  salaryBefore: number;
  salaryAfter: number;
  promoted: boolean;
  gradeFrom?: JobGrade;
  gradeTo?: JobGrade;
  promoHeld: boolean;
  holdReasons?: string[];
}

export interface JobOutcome {
  success: boolean;
  family: JobFamilyKey;
  company: CompanyTypeKey;
  chance: number;
  roll: number;
  job?: JobState;
}

export type ReviewGrade = "S" | "A" | "B" | "C" | "D";

/** 나이 1살 증가 시 생성되는 연간 리뷰 기록 */
export interface YearlyReview {
  id: string;
  age: number;
  stage: LifeStage;
  kind: "normal" | "neglected"; // neglected = 오프라인 다년 방치 요약
  counters: YearCounters;
  score: number;
  grade: ReviewGrade;
  exam?: { score: number; tier: string };
  work?: WorkReview; // 직장인 업무평가(있으면)
  incident?: { cause: string; healthHit: number }; // 회복 가능한 병/사고
  death?: { cause: string }; // 사망(엔딩)
  degreeChange?: { to: Degree }; // 학위 취득(대학 졸업/대학원 졸업)
  selfDevPenaltyApplied: boolean;
  salaryBonusForfeited?: boolean; // Phase3 연봉협상에서 소비
  neglectedYears?: number;
  savingsDelta: number; // 그 해(구간) 저축 변동(만원) — 연봉-생활비, 무직 기간엔 0
  createdAt: number;
}

/** 진행 중인 세션형 액션 (예: 공부하기 30분) */
export interface ActiveSession {
  actionType: string;
  startedAt: number; // epoch ms
  availableCompleteAt: number; // 완료 버튼이 활성화되는 시각
  expiresAt: number; // 이 시각을 넘기면 보상 최소화
  hiddenMs: number; // 세션 동안 페이지가 숨겨져 있던 누적 시간
}

/** 한 해(게임 1년) 동안의 활동 카운터 — Phase 2 연간 리뷰에서 사용 */
export interface YearCounters {
  study: number;
  exercise: number;
  selfDev: number;
  meals: number;
}

export interface Character {
  id: string;
  userId: string; // 익명 guest_xxxx
  name: string;
  color: string; // 마스코트 색상 팔레트 키 (blush/mint/sky/butter/grape/coral ...)
  gender: Gender; // 가상 성별 — 신장 분포·외형에만 영향
  heightPotential: number; // 성인 목표 키(cm). 출생 시 성별 기반 결정, 현재 키는 나이로 파생
  degree: Degree; // 최종 학위(취업률·초봉 보너스)
  gradEnroll: GradEnroll | null; // 대학원 재학 중이면 설정
  university: UniversityChoice | null; // 학부 선택(대학생 단계~) — 등록금/학자금대출 추적
  avatar: string; // (레거시) 이모지 — 마스코트 도입 후 미사용, 호환성 위해 유지
  ageYears: number; // 파생값(표시용). bornAt 으로부터 계산
  lifeStage: LifeStage;
  level: number;
  exp: number;
  statPoints: number; // 레벨업으로 누적된 미배분 스탯 포인트(메이플스토리 스타일)
  status: CharacterStatus;
  stats: CharacterStats;
  bornAt: number; // 게임 나이 계산 기준 (epoch ms)
  createdAt: number;
  lastTickAt: number; // 마지막으로 시간 경과 감소를 적용한 시각
  lastExerciseAt: number; // 마지막 운동 시각 (장기 미운동 체중 증가 계산)
  cooldowns: Record<string, number>; // actionType -> 다시 가능한 시각(epoch ms)
  activeSession: ActiveSession | null;
  yearCounters: YearCounters;
  lastReviewedAge: number; // 연간 리뷰 추적용 (마지막으로 리뷰한 나이)
  reviews: YearlyReview[]; // 연간 리뷰 기록 (성장 기록 화면)
  job: JobState | null; // 취업 전 null
  jobApplications: number; // 누적 지원 횟수
  savings: number; // 누적 저축(만원, 음수=빚)
  happiness: number; // 행복도(평생 평균, 0~100)
  deathAge?: number; // 사망 나이(설정되면 엔딩)
  deathCause?: string; // 사인
  negotiateBackfire?: boolean; // 협상 역효과(괘씸죄) — 다음 연말 평가 1회 소비
}
