import type { AnswerRecord, Question } from '../types';

export function normalizeAnswer(answer: string[]) {
  return [...new Set(answer.map((item) => item.toUpperCase()))].sort();
}

export function isAnswerCorrect(selected: string[], answer: string[]) {
  const normalizedSelected = normalizeAnswer(selected);
  const normalizedAnswer = normalizeAnswer(answer);
  return (
    normalizedSelected.length === normalizedAnswer.length &&
    normalizedSelected.every((item, index) => item === normalizedAnswer[index])
  );
}

export function formatAnswer(answer: string[]) {
  return normalizeAnswer(answer).join('、');
}

export function getAllKnowledgePoints(questions: Question[]) {
  return Array.from(new Set(questions.flatMap((question) => question.knowledgePoints))).sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );
}

export function getAccuracy(records: AnswerRecord[]) {
  if (records.length === 0) return 0;
  return Math.round((records.filter((record) => record.correct).length / records.length) * 100);
}

export function getTodayRecords(records: AnswerRecord[]) {
  const today = new Date().toISOString().slice(0, 10);
  return records.filter((record) => record.answeredAt.slice(0, 10) === today);
}

export function filterQuestions(
  questions: Question[],
  filters: {
    keyword?: string;
    knowledgePoint?: string;
    difficulty?: string;
    type?: string;
  },
) {
  const keyword = filters.keyword?.trim().toLowerCase();
  return questions.filter((question) => {
    const matchesKeyword =
      !keyword ||
      `${question.stem} ${question.options.map((option) => option.text).join(' ')} ${question.officialExplanation} ${
        question.aiExplanation
      }`
        .toLowerCase()
        .includes(keyword);
    const matchesPoint = !filters.knowledgePoint || question.knowledgePoints.includes(filters.knowledgePoint);
    const matchesDifficulty = !filters.difficulty || question.difficulty === filters.difficulty;
    const matchesType = !filters.type || question.type === filters.type;
    return matchesKeyword && matchesPoint && matchesDifficulty && matchesType;
  });
}

export function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
