export type QuestionType = 'single' | 'multiple';
export type Difficulty = '基础' | '进阶' | '高频考点' | '易错题' | '综合题';
export type StudyMode = 'practice' | 'memorize' | 'challenge';
export type ThemeMode = 'light' | 'dark';
export type WrongReason = '概念混淆' | '审题不清' | '知识点遗忘' | '多选漏选' | '场景判断错误';

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: number;
  originalNumber?: number;
  stem: string;
  type: QuestionType;
  options: QuestionOption[];
  answer: string[];
  officialExplanation: string;
  aiExplanation: string;
  knowledgePoints: string[];
  difficulty: Difficulty;
  tags: string[];
  source: string;
  sourceFile?: string;
  version: string;
}

export interface QuestionMeta {
  version: string;
  generatedAt: string;
  sources: string[];
  totalQuestions: number;
  successfulQuestions: number;
  failedItems: number;
  expectedQuestions: number | null;
}

export interface AnswerRecord {
  id: string;
  questionId: number;
  selected: string[];
  correctAnswer: string[];
  correct: boolean;
  durationSeconds: number;
  answeredAt: string;
  mode: StudyMode | 'exam';
  knowledgePoints: string[];
  type: QuestionType;
}

export interface WrongQuestion {
  questionId: number;
  selected: string[];
  correctAnswer: string[];
  reason?: WrongReason;
  note?: string;
  mastered?: boolean;
  firstWrongAt: string;
  lastWrongAt: string;
  wrongCount: number;
}

export interface ProgressBucket {
  answered: number;
  correct: number;
  currentQuestionId?: number;
  updatedAt: string;
}

export interface LearningSettings {
  theme: ThemeMode;
  dailyGoal: number;
}

export interface LearningExport {
  answerRecords: AnswerRecord[];
  wrongQuestions: Record<number, WrongQuestion>;
  favorites: number[];
  notes: Record<number, string>;
  doubts: number[];
  progress: Record<string, ProgressBucket>;
  settings: LearningSettings;
}
