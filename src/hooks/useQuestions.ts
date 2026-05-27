import { useEffect, useState } from 'react';
import type { Question, QuestionMeta } from '../types';

interface QuestionState {
  questions: Question[];
  meta?: QuestionMeta;
  loading: boolean;
  error?: string;
}

export function useQuestions(): QuestionState {
  const [state, setState] = useState<QuestionState>({ questions: [], loading: true });

  useEffect(() => {
    let active = true;

    async function loadQuestions() {
      try {
        const baseUrl = import.meta.env.BASE_URL;
        const [questionResponse, metaResponse] = await Promise.all([
          fetch(`${baseUrl}questions.json`),
          fetch(`${baseUrl}question_meta.json`),
        ]);

        if (!questionResponse.ok) {
          throw new Error(`questions.json 加载失败：${questionResponse.status}`);
        }

        const questions = (await questionResponse.json()) as Question[];
        const meta = metaResponse.ok ? ((await metaResponse.json()) as QuestionMeta) : undefined;
        if (active) {
          setState({ questions, meta, loading: false });
        }
      } catch (error) {
        if (active) {
          setState({
            questions: [],
            loading: false,
            error: error instanceof Error ? error.message : '题库加载失败',
          });
        }
      }
    }

    void loadQuestions();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
