import { DeleteOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { App as AntApp, Button, Card, Empty, Input, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QuestionPanel } from '../components/QuestionPanel';
import { useQuestionContext } from '../hooks/useQuestionContext';
import { useLearningStore } from '../store/useLearningStore';
import type { WrongReason } from '../types';
import { downloadTextFile } from '../utils/download';
import { formatAnswer, getAllKnowledgePoints } from '../utils/questionUtils';

const wrongReasons: WrongReason[] = ['概念混淆', '审题不清', '知识点遗忘', '多选漏选', '场景判断错误'];

export function WrongBookPage() {
  const { message } = AntApp.useApp();
  const { questions } = useQuestionContext();
  const wrongQuestions = useLearningStore((state) => state.wrongQuestions);
  const notes = useLearningStore((state) => state.notes);
  const setNote = useLearningStore((state) => state.setNote);
  const setWrongReason = useLearningStore((state) => state.setWrongReason);
  const markWrongMastered = useLearningStore((state) => state.markWrongMastered);
  const removeWrongQuestion = useLearningStore((state) => state.removeWrongQuestion);
  const [knowledgePoint, setKnowledgePoint] = useState<string>();
  const [reason, setReason] = useState<string>();
  const [status, setStatus] = useState<string>();

  const questionMap = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const knowledgePoints = useMemo(() => getAllKnowledgePoints(questions), [questions]);
  const wrongItems = useMemo(
    () =>
      Object.values(wrongQuestions)
        .map((wrong) => ({ wrong, question: questionMap.get(wrong.questionId) }))
        .filter((item) => item.question)
        .filter((item) => !knowledgePoint || item.question?.knowledgePoints.includes(knowledgePoint))
        .filter((item) => !reason || item.wrong.reason === reason)
        .filter((item) => !status || (status === 'mastered' ? item.wrong.mastered : !item.wrong.mastered)),
    [knowledgePoint, questionMap, reason, status, wrongQuestions],
  );

  const exportMarkdown = () => {
    const content = wrongItems
      .map(({ wrong, question }) => {
        if (!question) return '';
        return [
          `## 第 ${question.id} 题`,
          '',
          question.stem,
          '',
          ...question.options.map((option) => `- ${option.key}. ${option.text}`),
          '',
          `我的答案：${formatAnswer(wrong.selected) || '未作答'}`,
          `正确答案：${formatAnswer(question.answer)}`,
          `错误原因：${wrong.reason ?? '未标注'}`,
          `知识点：${question.knowledgePoints.join('、')}`,
          '',
          `官方解析：${question.officialExplanation}`,
          '',
          `AI解析：${question.aiExplanation}`,
          '',
          `个人笔记：${notes[question.id] ?? ''}`,
          '',
        ].join('\n');
      })
      .join('\n');
    downloadTextFile('ACP错题本.md', content, 'text/markdown;charset=utf-8');
    message.success('错题 Markdown 已导出');
  };

  return (
    <div className="page-stack">
      <Card
        title="错题本"
        extra={
          <Button icon={<DownloadOutlined />} onClick={exportMarkdown} disabled={wrongItems.length === 0}>
            导出 Markdown
          </Button>
        }
      >
        <div className="filter-row">
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
            placeholder="错误原因"
            value={reason}
            options={wrongReasons.map((item) => ({ value: item, label: item }))}
            onChange={setReason}
          />
          <Select
            allowClear
            placeholder="掌握状态"
            value={status}
            options={[
              { value: 'active', label: '待掌握' },
              { value: 'mastered', label: '已掌握' },
            ]}
            onChange={setStatus}
          />
        </div>
      </Card>

      {wrongItems.length === 0 ? (
        <Card>
          <Empty description="暂无错题" />
        </Card>
      ) : (
        wrongItems.map(({ wrong, question }) => {
          if (!question) return null;
          return (
            <QuestionPanel
              key={wrong.questionId}
              question={question}
              selected={wrong.selected}
              showAnswer
              submitted
              extra={
                <Space wrap>
                  <Tag color={wrong.mastered ? 'green' : 'red'}>{wrong.mastered ? '已掌握' : '待掌握'}</Tag>
                  <Tag>错 {wrong.wrongCount} 次</Tag>
                </Space>
              }
              footer={
                <div className="wrong-footer">
                  <Space wrap>
                    <Typography.Text type="danger">我的答案：{formatAnswer(wrong.selected) || '未作答'}</Typography.Text>
                    <Typography.Text>正确答案：{formatAnswer(wrong.correctAnswer)}</Typography.Text>
                  </Space>
                  <div className="wrong-controls">
                    <Select
                      placeholder="标注错误原因"
                      value={wrong.reason}
                      options={wrongReasons.map((item) => ({ value: item, label: item }))}
                      onChange={(value) => setWrongReason(question.id, value)}
                    />
                    <Input.TextArea
                      rows={2}
                      placeholder="个人笔记"
                      value={notes[question.id] ?? wrong.note ?? ''}
                      onChange={(event) => setNote(question.id, event.target.value)}
                    />
                  </div>
                  <Space wrap>
                    <Link to={`/practice?question=${question.id}`}>
                      <Button icon={<ReloadOutlined />}>重做</Button>
                    </Link>
                    <Button onClick={() => markWrongMastered(question.id)}>标记已掌握</Button>
                    <Popconfirm title="移出错题本？" onConfirm={() => removeWrongQuestion(question.id)}>
                      <Button danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              }
            />
          );
        })
      )}
    </div>
  );
}
