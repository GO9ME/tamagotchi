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
  communication: number;
  careerPotential: number;
  employability: number;
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
  avatar: string; // 이모지
  ageYears: number; // 파생값(표시용). bornAt 으로부터 계산
  lifeStage: LifeStage;
  level: number;
  exp: number;
  status: CharacterStatus;
  stats: CharacterStats;
  bornAt: number; // 게임 나이 계산 기준 (epoch ms)
  createdAt: number;
  lastTickAt: number; // 마지막으로 시간 경과 감소를 적용한 시각
  lastExerciseAt: number; // 마지막 운동 시각 (장기 미운동 체중 증가 계산)
  cooldowns: Record<string, number>; // actionType -> 다시 가능한 시각(epoch ms)
  activeSession: ActiveSession | null;
  yearCounters: YearCounters;
  lastReviewedAge: number; // Phase 2 연간 리뷰 추적용
}
