export type Screen = 'landing' | 'debate' | 'reveal' | 'interview' | 'technical' | 'live-interview';

export interface InterviewMetric {
  name: string;
  score: number;
  feedback: string;
}

export interface InterviewFeedback {
  overall_score: number;
  critique: string;
  metrics: InterviewMetric[];
  better_answer: string;
}

export interface InterviewState {
  questionIndex: number;
  answers: Record<number, string>;
  feedbacks: Record<number, InterviewFeedback>;
}

export type RecruiterName = 'ALEX' | 'MAYA' | 'JIN';

export type CoverageTopic = 'Technical' | 'Communication' | 'Depth' | 'Wildcard';

export type EvaluationMode =
  | 'FAANG'
  | 'Startup'
  | 'Research Lab'
  | 'Fintech'
  | 'ML Engineering'
  | 'Frontend Engineering';

export interface Message {
  recruiter: RecruiterName;
  text: string;
  timestamp: number;
}

export interface RecruiterConfidence {
  ALEX: number;
  MAYA: number;
  JIN: number;
}

export interface ThirtyDayAction {
  action: string;
  impact: string;
  effort: string;
}

export interface PredictedQuestion {
  question: string;
  recruiter: RecruiterName;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface RecruiterVerdict {
  recruiter: RecruiterName;
  stance: 'hire' | 'no-hire' | 'maybe';
  reasoning: string;
}

export interface ScoreData {
  readiness_score: number;
  verdict: string;
  hire_blockers: string[];
  hire_accelerators: string[];
  strongest_asset: string;
  thirty_day_plan: ThirtyDayAction[];
  predicted_questions?: PredictedQuestion[];
  recruiter_verdicts?: RecruiterVerdict[];
}
