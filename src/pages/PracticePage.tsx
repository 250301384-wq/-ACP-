import {
  ClearOutlined,
  EnterOutlined,
  LeftOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Alert, App as AntApp, Button, Card, Input, Select, Segmented, Space, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyQuestionPanel, QuestionPanel } from '../components/QuestionPanel';
import { useQuestionContext } from '../hooks/useQuestionContext';
import { useLearningStore } from '../store/useLearningStore';
import type { Difficulty, Question, StudyMode } from '../types';
import { filterQuestions, getAccuracy, getAllKnowledgePoints } from '../utils/questionUtils';

const difficulties: Difficulty[] = ['基础', '进阶', '高频考点', '易错题', '综合题'];
const modeOptions = [
  { label: '练习模式', value: 'practice' },
  { label: '背题模式', value: 'memorize' },
  { label: '闯关模式', value: 'challenge' },
];

export function PracticePage() {
  const { message } = AntApp.useApp();
  const { questions } = useQuestionContext();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<StudyMode>('practice');
  const [keyword, setKeyword] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState<string | undefined>(searchParams.get('point') ?? undefined);
  const [difficulty, setDifficulty] = useState<string>();
  const [type, setType] = useState<string>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  const submitAnswer = useLearningStore((state) => state.submitAnswer);
  const setCurrentQuestion = useLearningStore((state) => state.setCurrentQuestion);
  const toggleFavorite = useLearningStore((state) => state.toggleFavorite);
  const toggleDoubt = useLearningStore((state) => state.toggleDoubt);
  const favorites = useLearningStore((state) => state.favorites);
  const doubts = useLearningStore((state) => state.doubts);
  const answerRecords = useLearningStore((state) => state.answerRecords);

  const requestedQuestionId = Number(searchParams.get('question') ?? 0);
  const knowledgePoints = useMemo(() => getAllKnowledgePoints(questions), [questions]);
  const filtered = useMemo(
    () => filterQuestions(questions, { keyword, knowledgePoint, difficulty, type }),
    [difficulty, knowledgePoint, keyword, questions, type],
  );
  const currentQuestion = filtered[currentIndex];

  useEffect(() => {
    if (requestedQuestionId && filtered.length > 0) {
      const requestedIndex = filtered.findIndex((question) => question.id === requestedQuestionId);
      if (requestedIndex >= 0) {
        setCurrentIndex(requestedIndex);
      }
    }
  }, [filtered, requestedQuestionId]);

  useEffect(() => {
    if (filtered.length > 0 && currentIndex >= filtered.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, filtered.length]);

  useEffect(() => {
    setSelected([]);
    setSubmitted(false);
    setStartedAt(Date.now());
    if (currentQuestion) {
      setCurrentQuestion(`${mode}:${knowledgePoint ?? '全部'}`, currentQuestion.id);
    }
  }, [currentQuestion, knowledgePoint, mode, setCurrentQuestion]);

  const toggleOption = useCallback(
    (key: string) => {
      if (!currentQuestion || (submitted && mode !== 'memorize')) return;
      setSelected((current) => {
        if (currentQuestion.type === 'single') return [key];
        return current.includes(key) ? current.filter((item) => item !== key) : [...current, key].sort();
      });
    },
    [currentQuestion, mode, submitted],
  );

  const goToQuestion = useCallback(
    (direction: -1 | 1) => {
      if (filtered.length === 0) return;
      setCurrentIndex((index) => Math.min(Math.max(index + direction, 0), filtered.length - 1));
    },
    [filtered.length],
  );

  const handleSubmit = useCallback(() => {
    if (!currentQuestion) return;
    if (selected.length === 0) {
      message.warning('请先选择答案');
      return;
    }
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const correct = submitAnswer(currentQuestion, selected, durationSeconds, mode);
    setSubmitted(true);
    message[correct ? 'success' : 'error'](correct ? '回答正确' : '已加入错题本');
  }, [currentQuestion, message, mode, selected, startedAt, submitAnswer]);

  const handleFavorite = useCallback(
    (question?: Question) => {
      if (!question) return;
      const active = toggleFavorite(question.id);
      message.success(active ? '已收藏' : '已取消收藏');
    },
    [message, toggleFavorite],
  );

  const handleDoubt = useCallback(
    (question?: Question) => {
      if (!question) return;
      const active = toggleDoubt(question.id);
      message.success(active ? '已标记疑问' : '已取消疑问');
    },
    [message, toggleDoubt],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], .ant-select')) return;
      if (!currentQuestion) return;

      if (/^[1-8]$/.test(event.key)) {
        const option = currentQuestion.options[Number(event.key) - 1];
        if (option) {
          event.preventDefault();
          toggleOption(option.key);
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToQuestion(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToQuestion(-1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        handleFavorite(currentQuestion);
      } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        handleDoubt(currentQuestion);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQuestion, goToQuestion, handleDoubt, handleFavorite, handleSubmit, toggleOption]);

  const challengePoint = currentQuestion?.knowledgePoints[0];
  const challengeRecords = useMemo(
    () =>
      challengePoint
        ? answerRecords.filter((record) => record.mode === 'challenge' && record.knowledgePoints.includes(challengePoint))
        : [],
    [answerRecords, challengePoint],
  );
  const challengeAccuracy = getAccuracy(challengeRecords);
  const challengePassed = mode === 'challenge' && challengeRecords.length >= 5 && challengeAccuracy >= 80;
  const showAnswer = submitted || mode === 'memorize';
  const isFavorite = currentQuestion ? favorites.includes(currentQuestion.id) : false;
  const isDoubt = currentQuestion ? doubts.includes(currentQuestion.id) : false;

  return (
    <div className="page-stack practice-page">
      <Card title="答题设置">
        <div className="filter-row">
          <Segmented
            options={modeOptions}
            value={mode}
            onChange={(value) => {
              setMode(value as StudyMode);
              setSubmitted(false);
            }}
          />
          <Input.Search allowClear placeholder="关键词搜索" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Select
            allowClear
            showSearch
            placeholder="知识点"
            value={knowledgePoint}
            options={knowledgePoints.map((point) => ({ value: point, label: point }))}
            onChange={setKnowledgePoint}
          />
          <Select
            allowClear
            placeholder="难度"
            value={difficulty}
            options={difficulties.map((item) => ({ value: item, label: item }))}
            onChange={setDifficulty}
          />
          <Select
            allowClear
            placeholder="题型"
            value={type}
            options={[
              { value: 'single', label: '单选题' },
              { value: 'multiple', label: '多选题' },
            ]}
            onChange={setType}
          />
        </div>
      </Card>

      {challengePassed ? (
        <Alert
          showIcon
          type="success"
          message="本关通过"
          description={`${challengePoint} 闯关正确率 ${challengeAccuracy}%，已达到 80% 通过线。`}
        />
      ) : null}

      {currentQuestion ? (
        <QuestionPanel
          question={currentQuestion}
          selected={selected}
          submitted={submitted}
          showAnswer={showAnswer}
          onToggleOption={toggleOption}
          extra={
            <Typography.Text type="secondary">
              {currentIndex + 1} / {filtered.length}
            </Typography.Text>
          }
          footer={
            <Space wrap>
              <Button icon={<LeftOutlined />} onClick={() => goToQuestion(-1)} disabled={currentIndex === 0}>
                上一题
              </Button>
              <Button icon={<ClearOutlined />} onClick={() => setSelected([])}>
                清空
              </Button>
              <Button type="primary" icon={<EnterOutlined />} onClick={handleSubmit}>
                提交答案
              </Button>
              <Button icon={<RightOutlined />} onClick={() => goToQuestion(1)} disabled={currentIndex >= filtered.length - 1}>
                下一题
              </Button>
              <Button
                icon={isFavorite ? <StarFilled /> : <StarOutlined />}
                onClick={() => handleFavorite(currentQuestion)}
              >
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              <Button
                danger={isDoubt}
                icon={<QuestionCircleOutlined />}
                onClick={() => handleDoubt(currentQuestion)}
              >
                {isDoubt ? '已标疑问' : '标记疑问'}
              </Button>
            </Space>
          }
        />
      ) : (
        <EmptyQuestionPanel />
      )}

      <div className="fixed-action-bar">
        <Button icon={<LeftOutlined />} onClick={() => goToQuestion(-1)} disabled={currentIndex === 0}>
          上一题
        </Button>
        <Button type="primary" icon={<EnterOutlined />} onClick={handleSubmit} disabled={!currentQuestion}>
          提交答案
        </Button>
        <Button icon={<RightOutlined />} onClick={() => goToQuestion(1)} disabled={currentIndex >= filtered.length - 1}>
          下一题
        </Button>
        <Button icon={isFavorite ? <StarFilled /> : <StarOutlined />} onClick={() => handleFavorite(currentQuestion)}>
          收藏
        </Button>
        <Button danger={isDoubt} icon={<QuestionCircleOutlined />} onClick={() => handleDoubt(currentQuestion)}>
          疑问
        </Button>
      </div>
    </div>
  );
}
