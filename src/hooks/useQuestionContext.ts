import { useOutletContext } from 'react-router-dom';
import type { Question, QuestionMeta } from '../types';

export interface QuestionContext {
  questions: Question[];
  meta?: QuestionMeta;
  loading: boolean;
  error?: string;
}

export function useQuestionContext() {
  return useOutletContext<QuestionContext>();
}
