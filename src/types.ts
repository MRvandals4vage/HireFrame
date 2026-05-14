export type Screen = 'landing' | 'debate' | 'reveal';

export type RecruiterName = 'ALEX' | 'MAYA' | 'JIN';

export type CoverageTopic = 'Technical' | 'Communication' | 'Depth' | 'Wildcard';

export interface Message {
  recruiter: RecruiterName;
  text: string;
  timestamp: number;
}

export interface ThirtyDayAction {
  action: string;
  impact: string;
  effort: string;
}

export interface ScoreData {
  readiness_score: number;
  verdict: string;
  hire_blockers: string[];
  hire_accelerators: string[];
  strongest_asset: string;
  thirty_day_plan: ThirtyDayAction[];
}
