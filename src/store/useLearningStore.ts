import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AnswerRecord,
  LearningExport,
  LearningSettings,
  ProgressBucket,
  Question,
  StudyMode,
  WrongReason,
} from '../types';
import { isAnswerCorrect, normalizeAnswer } from '../utils/questionUtils';

interface LearningState extends LearningExport {
  submitAnswer: (question: Question, selected: string[], durationSeconds: number, mode: StudyMode | 'exam') => boolean;
  setCurrentQuestion: (scope: string, questionId: number) => void;
  toggleFavorite: (questionId: number) => boolean;
  toggleDoubt: (questionId: number) => boolean;
  setNote: (questionId: number, note: string) => void;
  setWrongReason: (questionId: number, reason: WrongReason) => void;
  markWrongMastered: (questionId: number) => void;
  removeWrongQuestion: (questionId: number) => void;
  updateSettings: (settings: Partial<LearningSettings>) => void;
  resetLearningData: () => void;
  exportLearningData: () => LearningExport;
  importLearningData: (data: Partial<LearningExport>) => void;
}

const defaultSettings: LearningSettings = {
  theme: 'light',
  dailyGoal: 40,
};

const emptyProgress = (): Record<string, ProgressBucket> => ({});

function updateProgressBucket(
  buckets: Record<string, ProgressBucket>,
  key: string,
  correct: boolean,
  questionId: number,
) {
  const current = buckets[key] ?? {
    answered: 0,
    correct: 0,
    updatedAt: new Date().toISOString(),
  };
  buckets[key] = {
    answered: current.answered + 1,
    correct: current.correct + (correct ? 1 : 0),
    currentQuestionId: questionId,
    updatedAt: new Date().toISOString(),
  };
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      answerRecords: [],
      wrongQuestions: {},
      favorites: [],
      notes: {},
      doubts: [],
      progress: emptyProgress(),
      settings: defaultSettings,

      submitAnswer: (question, selected, durationSeconds, mode) => {
        const normalizedSelected = normalizeAnswer(selected);
        const correctAnswer = normalizeAnswer(question.answer);
        const correct = isAnswerCorrect(normalizedSelected, correctAnswer);
        const now = new Date().toISOString();
        const record: AnswerRecord = {
          id: `${question.id}-${now}-${Math.random().toString(16).slice(2)}`,
          questionId: question.id,
          selected: normalizedSelected,
          correctAnswer,
          correct,
          durationSeconds,
          answeredAt: now,
          mode,
          knowledgePoints: question.knowledgePoints,
          type: question.type,
        };

        set((state) => {
          const progress = { ...state.progress };
          updateProgressBucket(progress, `${mode}:全部`, correct, question.id);
          for (const point of question.knowledgePoints) {
            updateProgressBucket(progress, `${mode}:${point}`, correct, question.id);
          }

          const wrongQuestions = { ...state.wrongQuestions };
          if (!correct) {
            const currentWrong = wrongQuestions[question.id];
            wrongQuestions[question.id] = {
              questionId: question.id,
              selected: normalizedSelected,
              correctAnswer,
              reason: currentWrong?.reason,
              note: currentWrong?.note,
              mastered: false,
              firstWrongAt: currentWrong?.firstWrongAt ?? now,
              lastWrongAt: now,
              wrongCount: (currentWrong?.wrongCount ?? 0) + 1,
            };
          } else if (wrongQuestions[question.id]) {
            wrongQuestions[question.id] = {
              ...wrongQuestions[question.id],
              mastered: true,
            };
          }

          return {
            answerRecords: [...state.answerRecords, record].slice(-5000),
            wrongQuestions,
            progress,
          };
        });

        return correct;
      },

      setCurrentQuestion: (scope, questionId) => {
        set((state) => ({
          progress: {
            ...state.progress,
            [scope]: {
              ...(state.progress[scope] ?? { answered: 0, correct: 0 }),
              currentQuestionId: questionId,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      toggleFavorite: (questionId) => {
        const existed = get().favorites.includes(questionId);
        set((state) => ({
          favorites: existed
            ? state.favorites.filter((item) => item !== questionId)
            : [...state.favorites, questionId],
        }));
        return !existed;
      },

      toggleDoubt: (questionId) => {
        const existed = get().doubts.includes(questionId);
        set((state) => ({
          doubts: existed ? state.doubts.filter((item) => item !== questionId) : [...state.doubts, questionId],
        }));
        return !existed;
      },

      setNote: (questionId, note) => {
        set((state) => ({
          notes: {
            ...state.notes,
            [questionId]: note,
          },
        }));
      },

      setWrongReason: (questionId, reason) => {
        set((state) => {
          const currentWrong = state.wrongQuestions[questionId];
          if (!currentWrong) return state;
          return {
            wrongQuestions: {
              ...state.wrongQuestions,
              [questionId]: {
                ...currentWrong,
                reason,
              },
            },
          };
        });
      },

      markWrongMastered: (questionId) => {
        set((state) => {
          const currentWrong = state.wrongQuestions[questionId];
          if (!currentWrong) return state;
          return {
            wrongQuestions: {
              ...state.wrongQuestions,
              [questionId]: {
                ...currentWrong,
                mastered: true,
              },
            },
          };
        });
      },

      removeWrongQuestion: (questionId) => {
        set((state) => {
          const wrongQuestions = { ...state.wrongQuestions };
          delete wrongQuestions[questionId];
          return { wrongQuestions };
        });
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
          },
        }));
      },

      resetLearningData: () => {
        set((state) => ({
          answerRecords: [],
          wrongQuestions: {},
          favorites: [],
          notes: {},
          doubts: [],
          progress: emptyProgress(),
          settings: state.settings,
        }));
      },

      exportLearningData: () => {
        const state = get();
        return {
          answerRecords: state.answerRecords,
          wrongQuestions: state.wrongQuestions,
          favorites: state.favorites,
          notes: state.notes,
          doubts: state.doubts,
          progress: state.progress,
          settings: state.settings,
        };
      },

      importLearningData: (data) => {
        set((state) => ({
          answerRecords: data.answerRecords ?? state.answerRecords,
          wrongQuestions: data.wrongQuestions ?? state.wrongQuestions,
          favorites: data.favorites ?? state.favorites,
          notes: data.notes ?? state.notes,
          doubts: data.doubts ?? state.doubts,
          progress: data.progress ?? state.progress,
          settings: {
            ...state.settings,
            ...(data.settings ?? {}),
          },
        }));
      },
    }),
    {
      name: 'acp-learning-store',
      partialize: (state) => ({
        answerRecords: state.answerRecords,
        wrongQuestions: state.wrongQuestions,
        favorites: state.favorites,
        notes: state.notes,
        doubts: state.doubts,
        progress: state.progress,
        settings: state.settings,
      }),
    },
  ),
);
