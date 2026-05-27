import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, Pagination, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuestionContext } from '../hooks/useQuestionContext';
import type { Difficulty, QuestionType } from '../types';
import { filterQuestions, getAllKnowledgePoints, formatAnswer } from '../utils/questionUtils';

const difficulties: Difficulty[] = ['基础', '进阶', '高频考点', '易错题', '综合题'];
const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
];

export function BrowsePage() {
  const { questions } = useQuestionContext();
  const [keyword, setKeyword] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState<string>();
  const [difficulty, setDifficulty] = useState<string>();
  const [type, setType] = useState<string>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const knowledgePoints = useMemo(() => getAllKnowledgePoints(questions), [questions]);
  const filtered = useMemo(
    () => filterQuestions(questions, { keyword, knowledgePoint, difficulty, type }),
    [difficulty, knowledgePoint, keyword, questions, type],
  );
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page-stack">
      <Card title="分类刷题">
        <div className="filter-row">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索题干、选项、解析"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            showSearch
            placeholder="知识点"
            value={knowledgePoint}
            options={knowledgePoints.map((point) => ({ value: point, label: point }))}
            onChange={(value) => {
              setKnowledgePoint(value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="难度"
            value={difficulty}
            options={difficulties.map((item) => ({ value: item, label: item }))}
            onChange={(value) => {
              setDifficulty(value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="题型"
            value={type}
            options={questionTypes}
            onChange={(value) => {
              setType(value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {pageItems.length === 0 ? (
        <Card>
          <Empty description="没有匹配题目" />
        </Card>
      ) : (
        pageItems.map((question) => (
          <Card
            key={question.id}
            className="browse-card"
            title={`第 ${question.id} 题`}
            extra={
              <Link to={`/practice?question=${question.id}`}>
                <Button type="primary">开始</Button>
              </Link>
            }
          >
            <Typography.Paragraph ellipsis={{ rows: 2 }}>{question.stem}</Typography.Paragraph>
            <Space wrap>
              <Tag color={question.type === 'single' ? 'blue' : 'purple'}>
                {question.type === 'single' ? '单选题' : '多选题'}
              </Tag>
              <Tag color="gold">{question.difficulty}</Tag>
              <Tag color="green">答案 {formatAnswer(question.answer)}</Tag>
              {question.knowledgePoints.slice(0, 4).map((point) => (
                <Tag key={point}>{point}</Tag>
              ))}
            </Space>
          </Card>
        ))
      )}

      <div className="pagination-row">
        <Pagination
          current={page}
          total={filtered.length}
          pageSize={pageSize}
          showSizeChanger={false}
          showTotal={(total) => `共 ${total} 题`}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
