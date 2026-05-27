import { BulbOutlined, CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { Card, Collapse, Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { Question } from '../types';
import { formatAnswer } from '../utils/questionUtils';

interface QuestionPanelProps {
  question: Question;
  selected: string[];
  submitted?: boolean;
  showAnswer?: boolean;
  onToggleOption?: (key: string) => void;
  footer?: ReactNode;
  extra?: ReactNode;
}

export function QuestionPanel({
  question,
  selected,
  submitted = false,
  showAnswer = false,
  onToggleOption,
  footer,
  extra,
}: QuestionPanelProps) {
  const answerSet = new Set(question.answer);
  const selectedSet = new Set(selected);

  return (
    <Card className="question-panel" title={`第 ${question.id} 题`} extra={extra}>
      <div className="question-meta">
        <Tag color={question.type === 'single' ? 'blue' : 'purple'}>
          {question.type === 'single' ? '单选题' : '多选题'}
        </Tag>
        <Tag color="gold">{question.difficulty}</Tag>
        {question.knowledgePoints.slice(0, 5).map((point) => (
          <Tag key={point}>{point}</Tag>
        ))}
      </div>
      <Typography.Paragraph className="question-stem">{question.stem}</Typography.Paragraph>
      <div className="option-list">
        {question.options.map((option) => {
          const isSelected = selectedSet.has(option.key);
          const isCorrect = answerSet.has(option.key);
          const optionClass = [
            'option-card',
            isSelected ? 'is-selected' : '',
            showAnswer && isCorrect ? 'is-correct' : '',
            showAnswer && isSelected && !isCorrect ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={option.key}
              type="button"
              className={optionClass}
              onClick={() => onToggleOption?.(option.key)}
              disabled={!onToggleOption || (submitted && showAnswer)}
            >
              <span className="option-key">{option.key}</span>
              <span className="option-text">{option.text}</span>
              {showAnswer && isCorrect ? <CheckCircleFilled className="option-state correct" /> : null}
              {showAnswer && isSelected && !isCorrect ? <CloseCircleFilled className="option-state wrong" /> : null}
            </button>
          );
        })}
      </div>

      {showAnswer ? (
        <div className="answer-block">
          <Space wrap>
            <Tag icon={<CheckCircleFilled />} color="success">
              正确答案：{formatAnswer(question.answer)}
            </Tag>
            <Tag icon={<InfoCircleOutlined />} color={submitted ? 'processing' : 'default'}>
              已选：{selected.length > 0 ? formatAnswer(selected) : '未作答'}
            </Tag>
          </Space>
          <Collapse
            className="explanation-collapse"
            defaultActiveKey={submitted ? ['official'] : []}
            items={[
              {
                key: 'official',
                label: '官方解析',
                children: <Typography.Paragraph>{question.officialExplanation || '暂无官方解析'}</Typography.Paragraph>,
              },
              {
                key: 'ai',
                label: 'AI 深度解析',
                children: <Typography.Paragraph>{question.aiExplanation || '暂无 AI 解析'}</Typography.Paragraph>,
              },
              {
                key: 'points',
                label: '核心知识点',
                children: (
                  <Space wrap>
                    {question.knowledgePoints.map((point) => (
                      <Tag key={point} icon={<BulbOutlined />} color="gold">
                        {point}
                      </Tag>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {footer ? <div className="question-footer">{footer}</div> : null}
    </Card>
  );
}

export function EmptyQuestionPanel({ text = '暂无匹配题目' }: { text?: string }) {
  return (
    <Card className="question-panel empty-question">
      <Typography.Text type="secondary">{text}</Typography.Text>
    </Card>
  );
}
