import { ClockCircleOutlined, FileDoneOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Alert, App as AntApp, Button, Card, InputNumber, Progress, Result, Space, Statistic, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QuestionPanel } from '../components/QuestionPanel';
import { useQuestionContext } from '../hooks/useQuestionContext';
import { useLearningStore } from '../store/useLearningStore';
import type { Question } from '../types';
import { isAnswerCorrect, shuffle } from '../utils/questionUtils';

interface ExamScore {
  total: number;
  correct: number;
  accuracy: number;
}

export function ExamPage() {
  const { message } = AntApp.useApp();
  const { questions } = useQuestionContext();
  const submitAnswer = useLearningStore((state) => state.submitAnswer);
  const [count, setCount] = useState(50);
  const [minutes, setMinutes] = useState(60);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<ExamScore>();
  const currentQuestion = examQuestions[currentIndex];

  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => answer.length > 0).length,
    [answers],
  );

  const startExam = () => {
    const picked = shuffle(questions).slice(0, Math.min(count, questions.length));
    const now = Date.now();
    setExamQuestions(picked);
    setAnswers({});
    setCurrentIndex(0);
    setStartedAt(now);
    setEndsAt(now + minutes * 60 * 1000);
    setRemainingSeconds(minutes * 60);
    setSubmitted(false);
    setScore(undefined);
  };

  const finishExam = useCallback(() => {
    if (submitted || examQuestions.length === 0) return;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000 / Math.max(examQuestions.length, 1)));
    let correct = 0;

    for (const question of examQuestions) {
      const selected = answers[question.id] ?? [];
      if (isAnswerCorrect(selected, question.answer)) correct += 1;
      submitAnswer(question, selected, durationSeconds, 'exam');
    }

    const nextScore = {
      total: examQuestions.length,
      correct,
      accuracy: Math.round((correct / Math.max(examQuestions.length, 1)) * 100),
    };
    setScore(nextScore);
    setSubmitted(true);
    message.success('考试已交卷');
  }, [answers, examQuestions, message, startedAt, submitAnswer, submitted]);

  useEffect(() => {
    if (!endsAt || submitted) return undefined;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        window.clearInterval(timer);
        finishExam();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt, finishExam, submitted]);

  const toggleOption = (key: string) => {
    if (!currentQuestion || submitted) return;
    setAnswers((current) => {
      const selected = current[currentQuestion.id] ?? [];
      const nextSelected =
        currentQuestion.type === 'single'
          ? [key]
          : selected.includes(key)
            ? selected.filter((item) => item !== key)
            : [...selected, key].sort();
      return {
        ...current,
        [currentQuestion.id]: nextSelected,
      };
    });
  };

  const remainingText = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60,
  ).padStart(2, '0')}`;

  if (examQuestions.length === 0) {
    return (
      <div className="page-stack">
        <Card title="模拟考试">
          <div className="exam-config">
            <div>
              <Typography.Text>题量</Typography.Text>
              <InputNumber min={5} max={Math.max(5, questions.length)} value={count} onChange={(value) => setCount(value ?? 50)} />
            </div>
            <div>
              <Typography.Text>限时（分钟）</Typography.Text>
              <InputNumber min={5} max={180} value={minutes} onChange={(value) => setMinutes(value ?? 60)} />
            </div>
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={startExam} disabled={questions.length === 0}>
              开始考试
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Card>
        <div className="exam-status">
          <Statistic title="剩余时间" value={remainingText} prefix={<ClockCircleOutlined />} />
          <Statistic title="已作答" value={answeredCount} suffix={`/ ${examQuestions.length}`} />
          <Progress
            percent={Math.round((answeredCount / Math.max(examQuestions.length, 1)) * 100)}
            className="exam-progress"
          />
          <Space wrap>
            <Button onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}>
              上一题
            </Button>
            <Button
              onClick={() => setCurrentIndex((index) => Math.min(examQuestions.length - 1, index + 1))}
              disabled={currentIndex >= examQuestions.length - 1}
            >
              下一题
            </Button>
            <Button type="primary" icon={<FileDoneOutlined />} onClick={finishExam} disabled={submitted}>
              交卷
            </Button>
          </Space>
        </div>
      </Card>

      {score ? (
        <Result
          status={score.accuracy >= 80 ? 'success' : 'warning'}
          title={`得分 ${score.correct} / ${score.total}`}
          subTitle={`正确率 ${score.accuracy}%`}
        />
      ) : (
        <Alert showIcon type="info" message="考试中" description="未作答题目交卷时会按错误记录，并自动进入错题本。" />
      )}

      {currentQuestion ? (
        <QuestionPanel
          question={currentQuestion}
          selected={answers[currentQuestion.id] ?? []}
          submitted={submitted}
          showAnswer={submitted}
          onToggleOption={submitted ? undefined : toggleOption}
          extra={
            <Typography.Text type="secondary">
              {currentIndex + 1} / {examQuestions.length}
            </Typography.Text>
          }
        />
      ) : null}
    </div>
  );
}
