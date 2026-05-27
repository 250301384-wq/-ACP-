import { StarFilled } from '@ant-design/icons';
import { Button, Card, Empty, Space, Tag } from 'antd';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { QuestionPanel } from '../components/QuestionPanel';
import { useQuestionContext } from '../hooks/useQuestionContext';
import { useLearningStore } from '../store/useLearningStore';

export function FavoritesPage() {
  const { questions } = useQuestionContext();
  const favorites = useLearningStore((state) => state.favorites);
  const toggleFavorite = useLearningStore((state) => state.toggleFavorite);

  const favoriteQuestions = useMemo(
    () => questions.filter((question) => favorites.includes(question.id)),
    [favorites, questions],
  );

  return (
    <div className="page-stack">
      <Card title="收藏题目">
        <Space wrap>
          <Tag color="gold" icon={<StarFilled />}>
            {favoriteQuestions.length} 道重点题
          </Tag>
        </Space>
      </Card>

      {favoriteQuestions.length === 0 ? (
        <Card>
          <Empty description="暂无收藏题目" />
        </Card>
      ) : (
        favoriteQuestions.map((question) => (
          <QuestionPanel
            key={question.id}
            question={question}
            selected={[]}
            showAnswer
            extra={
              <Space>
                <Link to={`/practice?question=${question.id}`}>
                  <Button type="primary">练习</Button>
                </Link>
                <Button onClick={() => toggleFavorite(question.id)}>取消收藏</Button>
              </Space>
            }
          />
        ))
      )}
    </div>
  );
}
